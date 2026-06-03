import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import type { Patient } from './entities/patient.entity';

@Injectable()
export class PatientsService implements OnModuleInit {
  private readonly patients = new Map<string, Patient>();

  onModuleInit(): void {
    if (this.patients.size > 0) {
      return;
    }
    const now = new Date();
    this.patients.set('p1', {
      id: 'p1',
      mrn: 'MRN-001',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1985-03-15',
      assignedDoctorId: '2',
      createdAt: now,
      updatedAt: now,
    });
  }

  findAll(): Patient[] {
    return [...this.patients.values()];
  }

  findOne(id: string): Patient {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
    return patient;
  }

  create(dto: CreatePatientDto): Patient {
    const now = new Date();
    const patient: Patient = {
      id: randomUUID(),
      ...dto,
      createdAt: now,
      updatedAt: now,
    };
    this.patients.set(patient.id, patient);
    return patient;
  }

  update(id: string, dto: UpdatePatientDto): Patient {
    const existing = this.findOne(id);
    const updated: Patient = {
      ...existing,
      ...dto,
      updatedAt: new Date(),
    };
    this.patients.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.patients.delete(id)) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
  }
}
