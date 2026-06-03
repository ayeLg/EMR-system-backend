export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  assignedDoctorId?: string;
  createdAt: Date;
  updatedAt: Date;
}
