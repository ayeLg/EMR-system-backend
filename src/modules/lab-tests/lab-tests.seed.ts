export const LAB_TEST_SEEDS = [
  {
    code: 'CBC',
    name: 'Complete Blood Count',
    category: 'Hematology',
    sampleType: 'Blood',
    price: 15000,
  },
  {
    code: 'LIPID',
    name: 'Lipid panel',
    category: 'Chemistry',
    sampleType: 'Blood',
    price: 35000,
  },
  {
    code: 'UA',
    name: 'Urinalysis',
    category: 'Microbiology',
    sampleType: 'Urine',
    price: 10000,
  },
] as const;
