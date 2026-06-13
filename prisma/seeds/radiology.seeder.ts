import { OrderPriority, OrderStatus } from '@prisma/client';
import { Seeder } from './seeder';

export const RadiologySeeder: Seeder = {
  name: 'RadiologySeeder',
  async run(prisma) {
    const patients = await prisma.patient.findMany();
    const doctors = await prisma.user.findMany({
      where: { role: { code: 'DOCTOR' } },
    });

    if (patients.length === 0 || doctors.length === 0) {
      console.log('Skipping RadiologySeeder: No patients or doctors found.');
      return;
    }

    const patient = patients[0];
    const doctor = doctors[0];

    // Create a mock encounter if none exists
    let encounter = await prisma.encounter.findFirst({
      where: { patientId: patient.id },
    });

    if (!encounter) {
      encounter = await prisma.encounter.create({
        data: {
          encounterNo: 'ENC-MOCK-RAD',
          patientId: patient.id,
          attendingDoctorId: doctor.id,
          encounterType: 'OPD',
          startTime: new Date(),
          status: 'OPEN',
        },
      });
    }

    // 1. Seed PENDING Radiology Order
    const existPending = await prisma.medicalOrder.findFirst({
      where: { description: 'Chest X-ray (PA view)' },
    });
    if (!existPending) {
      await prisma.medicalOrder.create({
        data: {
          encounterId: encounter.id,
          orderedById: doctor.id,
          orderType: 'RADIOLOGY',
          priority: OrderPriority.ROUTINE,
          status: OrderStatus.PENDING,
          description: 'Chest X-ray (PA view)',
          notes: 'Rule out pneumonia. Patient has productive cough.',
        },
      });
    }

    // 2. Seed IN_PROGRESS Radiology Order
    const existInProgress = await prisma.medicalOrder.findFirst({
      where: { description: 'Abdominal Ultrasound' },
    });
    if (!existInProgress) {
      await prisma.medicalOrder.create({
        data: {
          encounterId: encounter.id,
          orderedById: doctor.id,
          orderType: 'RADIOLOGY',
          priority: OrderPriority.URGENT,
          status: OrderStatus.IN_PROGRESS,
          description: 'Abdominal Ultrasound',
          notes: 'Persistent RUQ pain. Check for gallstones.',
        },
      });
    }

    // 3. Seed COMPLETED Radiology Order
    const existCompleted = await prisma.medicalOrder.findFirst({
      where: { description: 'Brain MRI' },
    });
    if (!existCompleted) {
      await prisma.medicalOrder.create({
        data: {
          encounterId: encounter.id,
          orderedById: doctor.id,
          orderType: 'RADIOLOGY',
          priority: OrderPriority.STAT,
          status: OrderStatus.COMPLETED,
          description: 'Brain MRI',
          notes: 'Acute onset headache and dizziness.',
          completedAt: new Date(),
          details: {
            findings:
              'No acute intracranial hemorrhage, mass effect, or large territorial infarct. Ventricles and sulci are normal for age.',
            impression:
              'Unremarkable Brain MRI. No acute intracranial findings.',
            imagingUrl: '/images/scans/mri_brain_normal.jpg',
            performedBy: doctor.fullName,
            performedAt: new Date().toISOString(),
          },
        },
      });
    }
  },
};
