import { CryptoService } from './crypto.service';

/** Decrypts an encrypted patient first/last name into a display full name. */
export function decryptPatientName(
  crypto: CryptoService,
  patient: { firstName: string; lastName: string },
): string {
  const first = crypto.safeDecrypt(patient.firstName) ?? '';
  const last = crypto.safeDecrypt(patient.lastName) ?? '';
  return `${first} ${last}`.trim();
}
