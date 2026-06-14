import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  RecordPaymentDto,
  SubmitClaimDto,
  VoidInvoiceDto,
} from './dto/billing.dto';

export interface SerializedInvoiceItem {
  id: string;
  invoiceId: string;
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  refType: string | null;
  refId: string | null;
}

export interface SerializedPayment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  referenceNo: string | null;
  receivedById: string;
  paidAt: Date;
  notes: string | null;
}

export interface SerializedInvoice {
  id: string;
  invoiceNo: string;
  encounterId: string;
  patientId: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  insuranceCoverage: number;
  patientBalance: number;
  issuedAt: Date | null;
  dueDate: Date | null;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  patient?: {
    firstName: string;
    lastName: string;
    mrn: string;
  } | null;
  encounter?: {
    encounterType: string;
    admissionDate: Date | null;
    dischargeDate: Date | null;
    createdAt: Date;
    ward?: {
      name: string;
    } | null;
  } | null;
  items?: SerializedInvoiceItem[];
  payments?: SerializedPayment[];
  claims?: any[];
  patientName?: string;
  mrn?: string;
}

interface EncounterWithWard {
  encounterType: string;
  admissionDate: Date | null;
  dischargeDate: Date | null;
  createdAt: Date;
  ward?: {
    name: string;
  } | null;
}

interface RawInvoiceInput {
  id: string;
  invoiceNo: string;
  encounterId: string;
  patientId: string;
  status: string;
  subtotal: Prisma.Decimal | number;
  discountAmount: Prisma.Decimal | number;
  taxAmount: Prisma.Decimal | number;
  totalAmount: Prisma.Decimal | number;
  paidAmount: Prisma.Decimal | number;
  insuranceCoverage: Prisma.Decimal | number;
  patientBalance: Prisma.Decimal | number;
  issuedAt: Date | null;
  dueDate: Date | null;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  patient?: {
    firstName: string;
    lastName: string;
    mrn: string;
  } | null;
  encounter?: EncounterWithWard | null;
  items?: {
    id: string;
    invoiceId: string;
    serviceId: string;
    description: string;
    quantity: number;
    unitPrice: Prisma.Decimal | number;
    discount: Prisma.Decimal | number;
    total: Prisma.Decimal | number;
    refType: string | null;
    refId: string | null;
  }[];
  payments?: {
    id: string;
    invoiceId: string;
    amount: Prisma.Decimal | number;
    method: string;
    referenceNo: string | null;
    receivedById: string;
    paidAt: Date;
    notes: string | null;
  }[];
  claims?: any[];
}

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvoices(): Promise<SerializedInvoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            mrn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((inv) => {
      const patientName = inv.patient
        ? `${inv.patient.firstName} ${inv.patient.lastName}`
        : 'Unknown';
      const mrn = inv.patient?.mrn ?? '—';
      return {
        ...this.serializeInvoice(inv),
        patientName,
        mrn,
      };
    });
  }

  async getInvoice(id: string): Promise<SerializedInvoice> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        encounter: {
          include: {
            ward: true,
          },
        },
        items: {
          include: {
            service: true,
          },
        },
        payments: true,
        claims: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    // If there are no items, automatically populate from stay, lab orders, prescriptions
    if (invoice.items.length === 0) {
      await this.populateInvoiceItems(id, invoice);

      // Re-fetch invoice with newly created items
      const updatedInvoice = await this.prisma.invoice.findUnique({
        where: { id },
        include: {
          patient: true,
          encounter: {
            include: {
              ward: true,
            },
          },
          items: {
            include: {
              service: true,
            },
          },
          payments: true,
          claims: true,
        },
      });

      if (!updatedInvoice) throw new NotFoundException('Invoice not found');
      const patientName = updatedInvoice.patient
        ? `${updatedInvoice.patient.firstName} ${updatedInvoice.patient.lastName}`
        : 'Unknown';
      const mrn = updatedInvoice.patient?.mrn ?? '—';
      return {
        ...this.serializeInvoice(updatedInvoice),
        patientName,
        mrn,
      };
    }

    const patientName = invoice.patient
      ? `${invoice.patient.firstName} ${invoice.patient.lastName}`
      : 'Unknown';
    const mrn = invoice.patient?.mrn ?? '—';
    return {
      ...this.serializeInvoice(invoice),
      patientName,
      mrn,
    };
  }

  private async populateInvoiceItems(
    invoiceId: string,
    invoice: { encounterId: string; encounter: EncounterWithWard },
  ): Promise<void> {
    const itemsToCreate: Prisma.InvoiceItemCreateManyInput[] = [];

    // Find the first service to satisfy the Service foreign key relation
    const defaultService = await this.prisma.service.findFirst({
      orderBy: { name: 'asc' },
    });

    if (!defaultService) return;

    // 1. Bed Stay Fee (if IPD)
    if (invoice.encounter.encounterType === 'IPD') {
      const admission =
        invoice.encounter.admissionDate || invoice.encounter.createdAt;
      const discharge = invoice.encounter.dischargeDate || new Date();
      const diffTime = Math.abs(discharge.getTime() - admission.getTime());
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const wardName = invoice.encounter.ward?.name || 'General Ward';
      const ratePerDay = 30000;
      const total = ratePerDay * diffDays;

      itemsToCreate.push({
        invoiceId,
        serviceId: defaultService.id,
        description: `Ward bed stay fee: ${wardName} (${diffDays} days)`,
        quantity: diffDays,
        unitPrice: new Prisma.Decimal(ratePerDay),
        discount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(total),
        refType: 'ENCOUNTER',
        refId: invoice.encounterId,
      });
    }

    // 2. Lab Orders Fee
    const labOrders = await this.prisma.labOrder.findMany({
      where: { encounterId: invoice.encounterId },
      include: {
        items: {
          include: {
            labTest: true,
          },
        },
      },
    });

    for (const order of labOrders) {
      for (const item of order.items) {
        const price = Number(item.labTest.price) || 15000;
        itemsToCreate.push({
          invoiceId,
          serviceId: defaultService.id,
          description: `Laboratory test: ${item.labTest.name}`,
          quantity: 1,
          unitPrice: new Prisma.Decimal(price),
          discount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(price),
          refType: 'LAB_ORDER',
          refId: order.id,
        });
      }
    }

    // 3. Prescriptions Fee
    const prescriptions = await this.prisma.prescription.findMany({
      where: { encounterId: invoice.encounterId },
      include: {
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    for (const rx of prescriptions) {
      for (const item of rx.items) {
        const qty = item.quantityPrescribed || 1;
        const unitPrice = 1200;
        const total = qty * unitPrice;
        itemsToCreate.push({
          invoiceId,
          serviceId: defaultService.id,
          description: `Medication: ${item.medication.brandName || item.medication.genericName} (${item.dose})`,
          quantity: qty,
          unitPrice: new Prisma.Decimal(unitPrice),
          discount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(total),
          refType: 'PRESCRIPTION',
          refId: rx.id,
        });
      }
    }

    if (itemsToCreate.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.invoiceItem.createMany({
          data: itemsToCreate,
        });

        const subtotal = itemsToCreate.reduce(
          (sum, item) => sum + Number(item.total),
          0,
        );
        const taxRate = 0.05;
        const taxAmount = subtotal * taxRate;
        const totalAmount = subtotal + taxAmount;

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            subtotal: new Prisma.Decimal(subtotal),
            taxAmount: new Prisma.Decimal(taxAmount),
            totalAmount: new Prisma.Decimal(totalAmount),
            patientBalance: new Prisma.Decimal(totalAmount),
            status: 'ISSUED',
          },
        });
      });
    }
  }

  async recordPayment(
    invoiceId: string,
    dto: RecordPaymentDto,
    userId: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const outstanding = Number(invoice.patientBalance);
    if (outstanding <= 0) {
      throw new BadRequestException('Invoice is already fully paid');
    }

    if (dto.amount > outstanding) {
      throw new BadRequestException(
        `Payment amount (${dto.amount} Ks) exceeds outstanding balance (${outstanding} Ks)`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: new Prisma.Decimal(dto.amount),
          method: dto.method,
          referenceNo: dto.referenceNo,
          notes: dto.notes,
          receivedById: userId,
        },
      });

      const newPaid = Number(invoice.paidAmount) + dto.amount;
      const newBalance = Number(invoice.patientBalance) - dto.amount;
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: new Prisma.Decimal(newPaid),
          patientBalance: new Prisma.Decimal(newBalance),
          status: newStatus,
        },
      });

      return payment;
    });
  }

  async submitClaim(invoiceId: string, dto: SubmitClaimDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const total = Number(invoice.totalAmount);
    const claimAmount = total * 0.8;
    const newCoverage = Number(invoice.insuranceCoverage) + claimAmount;
    const newBalance = Math.max(
      0,
      total - Number(invoice.paidAmount) - newCoverage,
    );
    const newStatus = newBalance <= 0 ? 'PAID' : invoice.status;

    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.insuranceClaim.create({
        data: {
          invoiceId,
          insuranceProvider: dto.insuranceProvider,
          policyNumber: dto.policyNumber,
          submittedAmount: new Prisma.Decimal(claimAmount),
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          insuranceCoverage: new Prisma.Decimal(newCoverage),
          patientBalance: new Prisma.Decimal(newBalance),
          status: newStatus,
        },
      });

      return claim;
    });
  }

  async voidInvoice(invoiceId: string, dto: VoidInvoiceDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') {
      throw new BadRequestException('PAID invoices cannot be voided directly');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'VOID',
          notes: `Voided. Reason: ${dto.reason}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'VOID_INVOICE',
          module: 'BILLING',
          resourceId: invoiceId,
          oldData: { status: invoice.status },
          newData: { status: 'VOID', reason: dto.reason },
        },
      });

      return updated;
    });
  }

  private serializeInvoice(invoice: unknown): SerializedInvoice {
    const inv = invoice as RawInvoiceInput;

    if (!inv) return {} as SerializedInvoice;

    return {
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      encounterId: inv.encounterId,
      patientId: inv.patientId,
      status: inv.status,
      subtotal: Number(inv.subtotal),
      discountAmount: Number(inv.discountAmount),
      taxAmount: Number(inv.taxAmount),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      insuranceCoverage: Number(inv.insuranceCoverage),
      patientBalance: Number(inv.patientBalance),
      issuedAt: inv.issuedAt,
      dueDate: inv.dueDate,
      notes: inv.notes,
      createdById: inv.createdById,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      patient: inv.patient,
      encounter: inv.encounter,
      items: inv.items?.map((item) => ({
        id: item.id,
        invoiceId: item.invoiceId,
        serviceId: item.serviceId,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        total: Number(item.total),
        refType: item.refType,
        refId: item.refId,
      })),
      payments: inv.payments?.map((payment) => ({
        id: payment.id,
        invoiceId: payment.invoiceId,
        amount: Number(payment.amount),
        method: payment.method,
        referenceNo: payment.referenceNo,
        receivedById: payment.receivedById,
        paidAt: payment.paidAt,
        notes: payment.notes,
      })),
      claims: inv.claims,
    };
  }
}
