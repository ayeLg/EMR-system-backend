import { Global, Module } from '@nestjs/common';
import { CryptoService } from '@/common/security/crypto.service';
import { TotpService } from '@/common/security/totp.service';

/**
 * Global so PHI encryption and TOTP are injectable from any feature module.
 */
@Global()
@Module({
  providers: [CryptoService, TotpService],
  exports: [CryptoService, TotpService],
})
export class SecurityModule {}
