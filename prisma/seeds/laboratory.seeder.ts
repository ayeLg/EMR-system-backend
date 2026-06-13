import { LabOrderStatus, OrderPriority } from '@prisma/client';
import { LAB_TEST_SEEDS } from '../../src/modules/master-data/lab-tests/lab-tests.seed';
import { Seeder } from './seeder';

export const LaboratorySeeder: Seeder = {
  name: 'LaboratorySeeder',
  async run(prisma) {
    // 0. Seed Lab Tests
    for (const test of LAB_TEST_SEEDS) {
      await prisma.labTest.upsert({
        where: { code: test.code },
        update: {
          name: test.name,
          category: test.category,
          sampleType: test.sampleType,
          price: test.price,
          referenceRanges: test.referenceRanges,
        },
        create: {
          code: test.code,
          name: test.name,
          category: test.category,
          sampleType: test.sampleType,
          price: test.price,
          referenceRanges: test.referenceRanges,
        },
      });
    }

    // 1. Get Patients and Doctors
    const patients = await prisma.patient.findMany();
    const doctors = await prisma.user.findMany({
      where: { role: { code: 'DOCTOR' } },
    });
    const labTechs = await prisma.user.findMany({
      where: { role: { code: 'LAB_TECH' } },
    });
    const superAdmins = await prisma.user.findMany({
      where: { role: { code: 'SUPER_ADMIN' } },
    });

    if (patients.length === 0 || doctors.length === 0) {
      console.log('Skipping LaboratorySeeder: No patients or doctors found.');
      return;
    }

    const patient = patients[0];
    const doctor = doctors[0];
    const labTech = labTechs[0] ?? doctor;
    const _verifier = superAdmins[0] ?? doctor;

    // Create a mock encounter if none exists
    let encounter = await prisma.encounter.findFirst({
      where: { patientId: patient.id },
    });

    if (!encounter) {
      encounter = await prisma.encounter.create({
        data: {
          encounterNo: 'ENC-MOCK-LAB',
          patientId: patient.id,
          attendingDoctorId: doctor.id,
          encounterType: 'OPD',
          startTime: new Date(),
          status: 'OPEN',
        },
      });
    }

    // Get Lab Tests
    const hemTest = await prisma.labTest.findUnique({
      where: { code: 'HEMOGLOBIN' },
    });
    const wbcTest = await prisma.labTest.findUnique({ where: { code: 'WBC' } });
    const potTest = await prisma.labTest.findUnique({
      where: { code: 'POTASSIUM' },
    });
    const sodTest = await prisma.labTest.findUnique({
      where: { code: 'SODIUM' },
    });

    if (!hemTest || !wbcTest || !potTest || !sodTest) {
      console.log('Skipping LaboratorySeeder: Core LabTests not found in DB.');
      return;
    }

    // 2. Seed ORDERED Lab Order
    const existOrdered = await prisma.labOrder.findFirst({
      where: { orderNo: 'LAB-0400031' },
    });
    if (!existOrdered) {
      await prisma.labOrder.create({
        data: {
          orderNo: 'LAB-0400031',
          encounterId: encounter.id,
          patientId: patient.id,
          orderedById: doctor.id,
          priority: OrderPriority.STAT,
          status: LabOrderStatus.ORDERED,
          clinicalNotes: 'Rule out anemia / electrolyte imbalance.',
          items: {
            create: [{ labTestId: hemTest.id }, { labTestId: wbcTest.id }],
          },
        },
      });
    }

    // 3. Seed SPECIMEN_COLLECTED Lab Order
    const existCollected = await prisma.labOrder.findFirst({
      where: { orderNo: 'LAB-0400032' },
    });
    if (!existCollected) {
      await prisma.labOrder.create({
        data: {
          orderNo: 'LAB-0400032',
          encounterId: encounter.id,
          patientId: patient.id,
          orderedById: doctor.id,
          priority: OrderPriority.ROUTINE,
          status: LabOrderStatus.SPECIMEN_COLLECTED,
          collectedAt: new Date(),
          clinicalNotes: 'Routine wellness check.',
          items: {
            create: [
              { labTestId: potTest.id, specimenBarcode: 'BC-POT-101' },
              { labTestId: sodTest.id, specimenBarcode: 'BC-SOD-102' },
            ],
          },
        },
      });
    }

    // 4. Seed RESULTED Lab Order
    const existResulted = await prisma.labOrder.findFirst({
      where: { orderNo: 'LAB-0400033' },
    });
    if (!existResulted) {
      const resultedOrder = await prisma.labOrder.create({
        data: {
          orderNo: 'LAB-0400033',
          encounterId: encounter.id,
          patientId: patient.id,
          orderedById: doctor.id,
          priority: OrderPriority.URGENT,
          status: LabOrderStatus.RESULTED,
          collectedAt: new Date(),
          resultedAt: new Date(),
          clinicalNotes: 'Post-op monitoring.',
          items: {
            create: [
              { labTestId: hemTest.id, specimenBarcode: 'BC-HEM-201' },
              { labTestId: potTest.id, specimenBarcode: 'BC-POT-202' },
            ],
          },
        },
        include: { items: true },
      });

      // Add results
      const itemHem = resultedOrder.items.find(
        (i) => i.labTestId === hemTest.id,
      );
      const itemPot = resultedOrder.items.find(
        (i) => i.labTestId === potTest.id,
      );

      if (itemHem) {
        await prisma.labResult.create({
          data: {
            labOrderItemId: itemHem.id,
            patientId: patient.id,
            resultValue: '11.2', // Abnormal low (female refLow is 12, male refLow is 13.5)
            unit: 'g/dL',
            referenceRangeLow: 12.0,
            referenceRangeHigh: 15.5,
            isAbnormal: true,
            isCritical: false,
            performedById: labTech.id,
            resultedAt: new Date(),
          },
        });
      }

      if (itemPot) {
        await prisma.labResult.create({
          data: {
            labOrderItemId: itemPot.id,
            patientId: patient.id,
            resultValue: '2.1', // Critical low (critical threshold is <= 2.5)
            unit: 'mmol/L',
            referenceRangeLow: 3.5,
            referenceRangeHigh: 5.1,
            isAbnormal: true,
            isCritical: true,
            interpretation: 'Hypokalemia - notify doctor immediately',
            performedById: labTech.id,
            resultedAt: new Date(),
          },
        });
      }
    }
  },
};
