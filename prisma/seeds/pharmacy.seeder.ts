import { Prisma } from '@prisma/client';
import { Seeder } from './seeder';

const MEDICATIONS = [
  {
    code: 'MED-PARA',
    genericName: 'Paracetamol',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'tablet',
    interactions: [] as Prisma.InputJsonValue[],
  },
  {
    code: 'MED-AMLO',
    genericName: 'Amlodipine',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    strength: '5mg',
    unit: 'tablet',
    interactions: [] as Prisma.InputJsonValue[],
  },
  {
    code: 'MED-AMOX',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    strength: '250mg',
    unit: 'capsule',
    interactions: [] as Prisma.InputJsonValue[],
  },
  {
    code: 'MED-WARF',
    genericName: 'Warfarin',
    category: 'Anticoagulant',
    dosageForm: 'Tablet',
    strength: '5mg',
    unit: 'tablet',
    interactions: [
      {
        targetCode: 'MED-ASPI',
        severity: 'SEVERE',
        description: 'Increased risk of bleeding when combined with Aspirin.',
      },
    ] as Prisma.InputJsonValue[],
  },
  {
    code: 'MED-ASPI',
    genericName: 'Aspirin',
    category: 'Antiplatelet',
    dosageForm: 'Tablet',
    strength: '100mg',
    unit: 'tablet',
    interactions: [
      {
        targetCode: 'MED-WARF',
        severity: 'SEVERE',
        description: 'Increased risk of bleeding when combined with Warfarin.',
      },
    ] as Prisma.InputJsonValue[],
  },
  {
    code: 'MED-SIMV',
    genericName: 'Simvastatin',
    category: 'Lipid Lowering',
    dosageForm: 'Tablet',
    strength: '20mg',
    unit: 'tablet',
    interactions: [
      {
        targetCode: 'MED-AMLO',
        severity: 'MODERATE',
        description:
          'Amlodipine increases exposure to Simvastatin (myopathy risk).',
      },
      {
        targetCode: 'MED-GEMF',
        severity: 'CONTRAINDICATED',
        description:
          'Concomitant use increases risk of severe myopathy/rhabdomyolysis.',
      },
    ] as Prisma.InputJsonValue[],
  },
  {
    code: 'MED-GEMF',
    genericName: 'Gemfibrozil',
    category: 'Lipid Lowering',
    dosageForm: 'Tablet',
    strength: '600mg',
    unit: 'tablet',
    interactions: [
      {
        targetCode: 'MED-SIMV',
        severity: 'CONTRAINDICATED',
        description:
          'Concomitant use increases risk of severe myopathy/rhabdomyolysis.',
      },
    ] as Prisma.InputJsonValue[],
  },
];

const INVENTORY_BATCHES = [
  // Paracetamol: Multiple batches to test FIFO
  {
    medicationCode: 'MED-PARA',
    batchNumber: 'B-PARA-01',
    expiryDate: new Date('2026-07-15'), // earlier expiry
    quantityOnHand: 50,
    reorderLevel: 200,
    unitCost: 0.05,
    supplier: 'PharmaCorp',
  },
  {
    medicationCode: 'MED-PARA',
    batchNumber: 'B-PARA-02',
    expiryDate: new Date('2027-03-01'), // later expiry
    quantityOnHand: 1150,
    reorderLevel: 200,
    unitCost: 0.05,
    supplier: 'PharmaCorp',
  },
  // Amlodipine: Low stock
  {
    medicationCode: 'MED-AMLO',
    batchNumber: 'B-AMLO-01',
    expiryDate: new Date('2026-06-20'),
    quantityOnHand: 80,
    reorderLevel: 100,
    unitCost: 0.1,
    supplier: 'MedDistributors',
  },
  // Warfarin: Low stock + near expiry
  {
    medicationCode: 'MED-WARF',
    batchNumber: 'B-WARF-01',
    expiryDate: new Date('2026-06-12'),
    quantityOnHand: 40,
    reorderLevel: 50,
    unitCost: 0.25,
    supplier: 'ApexMed',
  },
  // Amoxicillin
  {
    medicationCode: 'MED-AMOX',
    batchNumber: 'B-AMOX-01',
    expiryDate: new Date('2028-01-15'),
    quantityOnHand: 600,
    reorderLevel: 150,
    unitCost: 0.15,
    supplier: 'GlobalPharma',
  },
  // Simvastatin
  {
    medicationCode: 'MED-SIMV',
    batchNumber: 'B-SIMV-01',
    expiryDate: new Date('2027-11-30'),
    quantityOnHand: 300,
    reorderLevel: 100,
    unitCost: 0.2,
    supplier: 'MedDistributors',
  },
  // Aspirin: Near expiry
  {
    medicationCode: 'MED-ASPI',
    batchNumber: 'B-ASPI-01',
    expiryDate: new Date('2026-06-05'),
    quantityOnHand: 25,
    reorderLevel: 80,
    unitCost: 0.08,
    supplier: 'ApexMed',
  },
  // Gemfibrozil
  {
    medicationCode: 'MED-GEMF',
    batchNumber: 'B-GEMF-01',
    expiryDate: new Date('2027-05-01'),
    quantityOnHand: 150,
    reorderLevel: 50,
    unitCost: 0.35,
    supplier: 'GlobalPharma',
  },
];

export const PharmacySeeder: Seeder = {
  name: 'PharmacySeeder',
  async run(prisma) {
    // 1. Seed Medications
    for (const med of MEDICATIONS) {
      await prisma.medication.upsert({
        where: { code: med.code },
        update: {
          genericName: med.genericName,
          category: med.category,
          dosageForm: med.dosageForm,
          strength: med.strength,
          unit: med.unit,
          interactions: med.interactions as Prisma.InputJsonValue,
        },
        create: {
          code: med.code,
          genericName: med.genericName,
          category: med.category,
          dosageForm: med.dosageForm,
          strength: med.strength,
          unit: med.unit,
          interactions: med.interactions as Prisma.InputJsonValue,
        },
      });
    }

    // 2. Seed Drug Inventory Batches
    for (const batch of INVENTORY_BATCHES) {
      const medication = await prisma.medication.findUnique({
        where: { code: batch.medicationCode },
      });

      if (!medication) {
        throw new Error(
          `Medication with code ${batch.medicationCode} not found for seeding`,
        );
      }

      const existing = await prisma.drugInventory.findFirst({
        where: {
          medicationId: medication.id,
          batchNumber: batch.batchNumber,
        },
      });

      if (existing) {
        await prisma.drugInventory.update({
          where: { id: existing.id },
          data: {
            expiryDate: batch.expiryDate,
            quantityOnHand: batch.quantityOnHand,
            reorderLevel: batch.reorderLevel,
            unitCost: batch.unitCost,
            supplier: batch.supplier,
          },
        });
      } else {
        await prisma.drugInventory.create({
          data: {
            medicationId: medication.id,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantityOnHand: batch.quantityOnHand,
            reorderLevel: batch.reorderLevel,
            unitCost: batch.unitCost,
            supplier: batch.supplier,
          },
        });
      }
    }

    // 3. Seed Sample Prescriptions
    const patients = await prisma.patient.findMany();
    const doctors = await prisma.user.findMany({
      where: { role: { code: 'DOCTOR' } },
    });

    const medPara = await prisma.medication.findUnique({
      where: { code: 'MED-PARA' },
    });
    const medAmlo = await prisma.medication.findUnique({
      where: { code: 'MED-AMLO' },
    });
    const medSimv = await prisma.medication.findUnique({
      where: { code: 'MED-SIMV' },
    });
    const medWarf = await prisma.medication.findUnique({
      where: { code: 'MED-WARF' },
    });
    const medAspi = await prisma.medication.findUnique({
      where: { code: 'MED-ASPI' },
    });

    if (
      patients.length >= 3 &&
      doctors.length >= 2 &&
      medPara &&
      medAmlo &&
      medSimv &&
      medWarf &&
      medAspi
    ) {
      const p1 = patients[0];
      const p2 = patients[1];
      const p3 = patients[2];
      const doc1 = doctors[0];
      const doc2 = doctors[1];

      // Prescription 1: Routine prescription (Paracetamol + Amlodipine)
      const enc1 = await prisma.encounter.upsert({
        where: { encounterNo: 'ENC-0000001' },
        update: {},
        create: {
          encounterNo: 'ENC-0000001',
          patientId: p1.id,
          attendingDoctorId: doc1.id,
          encounterType: 'OPD',
          status: 'OPEN',
          startTime: new Date(),
        },
      });

      const rx1Existing = await prisma.prescription.findUnique({
        where: { rxNumber: 'RX-0300001' },
      });
      if (!rx1Existing) {
        await prisma.prescription.create({
          data: {
            rxNumber: 'RX-0300001',
            encounterId: enc1.id,
            patientId: p1.id,
            prescribedById: doc1.id,
            status: 'PENDING',
            prescribedAt: new Date(),
            items: {
              create: [
                {
                  medicationId: medPara.id,
                  dose: '500mg',
                  route: 'ORAL',
                  frequency: 'TDS',
                  durationDays: 5,
                  quantityPrescribed: 15,
                },
                {
                  medicationId: medAmlo.id,
                  dose: '5mg',
                  route: 'ORAL',
                  frequency: 'OD',
                  durationDays: 30,
                  quantityPrescribed: 30,
                },
              ],
            },
          },
        });
      }

      // Prescription 2: Moderate interaction prescription (Simvastatin + Amlodipine)
      const enc2 = await prisma.encounter.upsert({
        where: { encounterNo: 'ENC-0000002' },
        update: {},
        create: {
          encounterNo: 'ENC-0000002',
          patientId: p2.id,
          attendingDoctorId: doc2.id,
          encounterType: 'OPD',
          status: 'OPEN',
          startTime: new Date(),
        },
      });

      const rx2Existing = await prisma.prescription.findUnique({
        where: { rxNumber: 'RX-0300002' },
      });
      if (!rx2Existing) {
        await prisma.prescription.create({
          data: {
            rxNumber: 'RX-0300002',
            encounterId: enc2.id,
            patientId: p2.id,
            prescribedById: doc2.id,
            status: 'PENDING',
            prescribedAt: new Date(),
            items: {
              create: [
                {
                  medicationId: medSimv.id,
                  dose: '20mg',
                  route: 'ORAL',
                  frequency: 'ON',
                  durationDays: 30,
                  quantityPrescribed: 30,
                },
                {
                  medicationId: medAmlo.id,
                  dose: '5mg',
                  route: 'ORAL',
                  frequency: 'OD',
                  durationDays: 30,
                  quantityPrescribed: 30,
                },
              ],
            },
          },
        });
      }

      // Prescription 3: Severe interaction prescription (Warfarin + Aspirin)
      const enc3 = await prisma.encounter.upsert({
        where: { encounterNo: 'ENC-0000003' },
        update: {},
        create: {
          encounterNo: 'ENC-0000003',
          patientId: p3.id,
          attendingDoctorId: doc1.id,
          encounterType: 'OPD',
          status: 'OPEN',
          startTime: new Date(),
        },
      });

      const rx3Existing = await prisma.prescription.findUnique({
        where: { rxNumber: 'RX-0300003' },
      });
      if (!rx3Existing) {
        await prisma.prescription.create({
          data: {
            rxNumber: 'RX-0300003',
            encounterId: enc3.id,
            patientId: p3.id,
            prescribedById: doc1.id,
            status: 'PENDING',
            prescribedAt: new Date(),
            items: {
              create: [
                {
                  medicationId: medWarf.id,
                  dose: '5mg',
                  route: 'ORAL',
                  frequency: 'OD',
                  durationDays: 10,
                  quantityPrescribed: 10,
                },
                {
                  medicationId: medAspi.id,
                  dose: '100mg',
                  route: 'ORAL',
                  frequency: 'OD',
                  durationDays: 30,
                  quantityPrescribed: 30,
                },
              ],
            },
          },
        });
      }
    }
  },
};
