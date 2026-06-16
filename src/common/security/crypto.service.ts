import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';

/**
 * Application-level field encryption for PHI (first_name, last_name,
 * nrc_number, address, …) per the EMR security rules. AES-256-GCM gives
 * confidentiality + integrity (auth tag). Encrypt before DB write, decrypt
 * on read. Key comes from PHI_ENCRYPTION_KEY (32 bytes / 64 hex chars).
 *
 * Stored format: `base64(iv):base64(authTag):base64(ciphertext)`
 */
@Injectable()
export class CryptoService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96-bit IV, recommended for GCM
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const hex = config.getOrThrow<string>('phi.encryptionKey');
    this.key = Buffer.from(hex, 'hex');
    if (this.key.length !== 32) {
      throw new Error(
        'PHI_ENCRYPTION_KEY must decode to 32 bytes (64 hex chars)',
      );
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(CryptoService.IV_LENGTH);
    const cipher = createCipheriv(CryptoService.ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join(':');
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split(':');
    if (!ivB64 || !tagB64 || !dataB64) {
      throw new Error('Invalid ciphertext format');
    }
    const decipher = createDecipheriv(
      CryptoService.ALGORITHM,
      this.key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  /**
   * Tolerant decrypt: returns the value unchanged if it isn't in the
   * `iv:tag:data` format (e.g. legacy plaintext rows during migration).
   */
  safeDecrypt(value: string | null | undefined): string | null {
    if (value == null) return null;
    if (value.split(':').length !== 3) return value;
    try {
      return this.decrypt(value);
    } catch {
      return value;
    }
  }

  /**
   * Deterministic keyed hash (blind index) for equality search over encrypted
   * fields — same input always yields the same hash, so NRC dedup works without
   * exposing the value. Not reversible.
   */
  blindIndex(value: string): string {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
    return createHmac('sha256', this.key).update(normalized).digest('hex');
  }
}
