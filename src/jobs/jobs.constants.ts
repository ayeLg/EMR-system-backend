export const QUEUE = {
  APPOINTMENTS: 'appointments',
  MAINTENANCE: 'maintenance',
  LAB: 'lab',
} as const;

export const JOB = {
  // appointments queue (delayed, per-appointment)
  REMINDER_24H: 'reminder-24h',
  REMINDER_1H: 'reminder-1h',
  NO_SHOW: 'no-show',
  // maintenance queue (repeatable, daily)
  RX_EXPIRY: 'rx-expiry',
  DRUG_LOW_STOCK: 'drug-low-stock',
  DRUG_EXPIRY: 'drug-expiry',
  INVOICE_OVERDUE: 'invoice-overdue',
  // lab queue (delayed, per-critical-result)
  LAB_CRITICAL_ESCALATION: 'lab-critical-escalation',
} as const;

export interface AppointmentJobData {
  appointmentId: string;
}
export interface LabEscalationJobData {
  labResultId: string;
}
