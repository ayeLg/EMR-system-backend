import { LabOrderStatus, OrderPriority } from '@prisma/client';

export class LabTestItemResponseDto {
  id: string;
  testName: string;
  unit: string;
  refLow: number;
  refHigh: number;
  criticalLow: number;
  criticalHigh: number;
  value?: number;
}

export class LabOrderResponseDto {
  id: string;
  orderNo: string;
  patientName: string;
  mrn: string;
  orderedBy: string;
  orderedAt: string;
  priority: OrderPriority;
  status: LabOrderStatus;
  clinicalNotes?: string;
  items: LabTestItemResponseDto[];
}
