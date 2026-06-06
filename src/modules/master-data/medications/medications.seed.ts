export const MEDICATION_SEEDS = [
  {
    code: 'MED-PARA',
    genericName: 'Paracetamol',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'tablet',
  },
  {
    code: 'MED-AMLO',
    genericName: 'Amlodipine',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    strength: '5mg',
    unit: 'tablet',
  },
  {
    code: 'MED-AMOX',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    strength: '250mg',
    unit: 'capsule',
  },
] as const;
