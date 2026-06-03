export const Subjects = {
  User: 'User',
  Patient: 'Patient',
} as const;

export const USER_SUBJECT = Subjects.User;
export const PATIENT_SUBJECT = Subjects.Patient;

export type AppSubject = (typeof Subjects)[keyof typeof Subjects];
export type AppSubjects = AppSubject | 'all';
