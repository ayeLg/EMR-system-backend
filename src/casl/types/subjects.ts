export const Subjects = {
  User: 'User',
  Patient: 'Patient',
} as const;

export type AppSubject = (typeof Subjects)[keyof typeof Subjects];
export type AppSubjects = AppSubject | 'all';
