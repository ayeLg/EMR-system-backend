import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

/**
 * TOTP (RFC 6238) for 2FA. CLAUDE.md requires MFA for DOCTOR and SUPER_ADMIN.
 *
 * Enrollment flow:
 *   1. generateSecret() -> persist (encrypted) on the user
 *   2. buildOtpAuthUrl() + toQrDataUrl() -> show QR for an authenticator app
 *   3. verify() the first token to confirm enrollment
 * Login flow: verify() the submitted 6-digit code against the stored secret.
 */
@Injectable()
export class TotpService {
  constructor(private readonly config: ConfigService) {}

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  buildOtpAuthUrl(accountName: string, secret: string): string {
    const issuer = this.config.get<string>('totp.issuer', 'EMR-System');
    return authenticator.keyuri(accountName, issuer, secret);
  }

  verify(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }

  toQrDataUrl(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }
}
