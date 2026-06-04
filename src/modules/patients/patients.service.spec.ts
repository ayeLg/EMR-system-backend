import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import type { CreatePatientDto } from './dto/create-patient.dto';

describe('PatientsService (unit)', () => {
  let service: PatientsService;

  beforeEach(() => {
    service = new PatientsService();
    service.onModuleInit();
  });

  const validDto = (): CreatePatientDto => ({
    mrn: 'MRN-0100043',
    firstName: 'Aung',
    lastName: 'Min',
    dateOfBirth: '1990-01-01',
    assignedDoctorId: '2',
  });

  it('throws NotFoundException for an unknown id', () => {
    expect(() => service.findOne('does-not-exist')).toThrow(NotFoundException);
  });

  it('findAll() returns every stored patient, including created ones', () => {
    const before = service.findAll().length;

    service.create(validDto());

    expect(service.findAll()).toHaveLength(before + 1);
  });

  it('create() assigns an id and stores the patient retrievably', () => {
    const created = service.create(validDto());

    expect(created.id).toBeDefined();
    expect(service.findOne(created.id)).toEqual(created);
  });

  it('update() changes fields and bumps updatedAt', () => {
    const created = service.create(validDto());
    const before = created.updatedAt.getTime();

    const updated = service.update(created.id, { lastName: 'Khaing' });

    expect(updated.lastName).toBe('Khaing');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('update() throws NotFoundException for an unknown id', () => {
    expect(() => service.update('does-not-exist', { lastName: 'X' })).toThrow(
      NotFoundException,
    );
  });

  it('remove() deletes an existing patient', () => {
    const created = service.create(validDto());

    service.remove(created.id);

    expect(() => service.findOne(created.id)).toThrow(NotFoundException);
  });

  it('remove() throws NotFoundException for an unknown id', () => {
    expect(() => service.remove('does-not-exist')).toThrow(NotFoundException);
  });
});
