export const SERVICE_SEEDS = [
  {
    code: 'CONSULT_OPD',
    name: 'OPD Consultation',
    category: 'Consultation',
    price: 30000,
    taxRate: 0,
  },
  {
    code: 'ECG',
    name: 'ECG',
    category: 'Procedure',
    price: 25000,
    taxRate: 0,
  },
  {
    code: 'DRESSING',
    name: 'Wound dressing',
    category: 'Procedure',
    price: 8000,
    taxRate: 0,
  },
] as const;
