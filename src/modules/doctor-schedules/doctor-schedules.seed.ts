/** dayOfWeek 0=Sun … 6=Sat — matches Prisma DoctorSchedule.dayOfWeek */
export const DAY_LABELS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

export const DOCTOR_SCHEDULE_SEEDS = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotMinutes: 15 },
  { dayOfWeek: 3, startTime: '13:00', endTime: '17:00', slotMinutes: 15 },
] as const;
