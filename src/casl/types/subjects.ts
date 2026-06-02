import { InferSubjects } from '@casl/ability';
import { Patient } from '@/patients/entities/patient.entity';
import { User } from '@/users/entities/user.entity';

export type AppSubjects = InferSubjects<typeof User | typeof Patient> | 'all';
