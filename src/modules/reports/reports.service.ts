import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. KPIs
    const totalPatients = await this.prisma.patient.count();

    const todayAppointments = await this.prisma.appointment.count({
      where: {
        scheduledAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const todayPayments = await this.prisma.payment.findMany({
      where: {
        paidAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        amount: true,
      },
    });
    const revenueToday = todayPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    const pendingLab = await this.prisma.labOrder.count({
      where: {
        status: {
          in: ['ORDERED', 'SPECIMEN_COLLECTED', 'IN_PROCESS'],
        },
      },
    });

    // 2. Patient Census (last 7 days)
    const censusSeries: { date: string; patients: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
        0,
      );
      const endOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999,
      );

      const count = await this.prisma.encounter.count({
        where: {
          encounterType: 'IPD',
          startTime: { lte: endOfDay },
          OR: [{ endTime: null }, { endTime: { gte: startOfDay } }],
        },
      });

      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      censusSeries.push({ date: formattedDate, patients: count });
    }

    // 3. Revenue by Department
    const payments = await this.prisma.payment.findMany({
      include: {
        invoice: {
          include: {
            encounter: {
              include: {
                attendingDoctor: {
                  include: {
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const revenueByDeptMap = new Map<string, number>();

    // Pre-populate known departments to make sure they show up in analytics
    const departments = await this.prisma.department.findMany();
    for (const dept of departments) {
      revenueByDeptMap.set(dept.name, 0);
    }
    revenueByDeptMap.set('Other', 0);

    for (const p of payments) {
      const deptName =
        p.invoice?.encounter?.attendingDoctor?.department?.name || 'Other';
      const amount = Number(p.amount);
      revenueByDeptMap.set(
        deptName,
        (revenueByDeptMap.get(deptName) || 0) + amount,
      );
    }

    const revenueByDept = Array.from(revenueByDeptMap.entries())
      .map(([dept, revenue]) => ({
        dept,
        revenue,
      }))
      .filter((item) => item.revenue > 0 || item.dept !== 'Other');

    // 4. Disease Burden (top 5)
    const diagnoses = await this.prisma.diagnosis.groupBy({
      by: ['icd10Code', 'description'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    const diseaseBurden = diagnoses.map((d) => ({
      disease: `${d.description} (${d.icd10Code})`,
      count: d._count.id,
    }));

    // Fallback/Mock burden values if database is empty so charts don't look completely empty on fresh installs
    if (diseaseBurden.length === 0) {
      diseaseBurden.push(
        { disease: 'Hypertension (I10)', count: 0 },
        { disease: 'Type 2 diabetes (E11)', count: 0 },
      );
    }

    // 5. Appointment Status Breakdown
    const appointmentStatus = await this.prisma.appointment.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const statusLabels: Record<string, string> = {
      SCHEDULED: 'Scheduled',
      ARRIVED: 'Arrived',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No-show',
    };

    const apptStatusBreakdown = appointmentStatus.map((s) => ({
      type: statusLabels[s.status] || s.status,
      value: s._count.id,
    }));

    return {
      kpis: {
        totalPatients,
        todayAppointments,
        revenueToday,
        pendingLab,
      },
      censusSeries,
      revenueByDept,
      diseaseBurden,
      apptStatusBreakdown,
    };
  }
}
