export const Subjects = {
  User: 'User',
  Patient: 'Patient',
  MasterData: 'MasterData',
} as const;

export const USER_SUBJECT = Subjects.User;
export const PATIENT_SUBJECT = Subjects.Patient;
export const MASTER_DATA_SUBJECT = Subjects.MasterData;

export type AppSubject = (typeof Subjects)[keyof typeof Subjects];
export type AppSubjects = AppSubject | 'all';
