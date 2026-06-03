import { SetMetadata } from '@nestjs/common';
import { CHECK_POLICIES_KEY } from '@/common/constants/metadata-keys';
import { PolicyHandler } from '@/authorization/casl/interfaces/policy-handler.interface';

export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
