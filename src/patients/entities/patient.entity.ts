export class Patient {
  id!: string;
  mrn!: string;
  firstName!: string;
  lastName!: string;
  dateOfBirth!: string;
  assignedDoctorId?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Patient>) {
    Object.assign(this, partial);
  }
}
