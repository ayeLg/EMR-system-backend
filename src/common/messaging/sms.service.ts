import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Pluggable SMS gateway.
 *
 * Dev/on-prem default is the `log` adapter — it records the message instead of
 * sending it, so no external credentials are needed. Wire a real provider
 * (Twilio, local aggregator) by switching `SMS_PROVIDER` and adding a branch in
 * `send()`; the rest of the app only depends on this interface.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: string;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.provider = this.config.get<string>('sms.provider', 'log');
    this.from = this.config.get<string>('sms.from', 'YangonEMR');
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async by contract; real providers await network I/O
  async send(to: string | null | undefined, body: string): Promise<void> {
    if (!to) {
      this.logger.warn(`SMS skipped — no phone number (body: ${body})`);
      return;
    }

    switch (this.provider) {
      case 'log':
        this.logger.log(`[SMS ${this.from} → ${to}] ${body}`);
        return;
      // case 'twilio': // TODO: wire real provider when credentials are provisioned
      default:
        this.logger.warn(
          `Unknown SMS provider "${this.provider}" — logging instead. [→ ${to}] ${body}`,
        );
    }
  }
}
