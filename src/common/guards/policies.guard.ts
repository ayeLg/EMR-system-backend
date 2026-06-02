import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '@/casl/casl-ability.factory';
import { CHECK_POLICIES_KEY } from '@/common/constants/metadata-keys';
import {
  IPolicyHandler,
  PolicyHandler,
} from '@/casl/interfaces/policy-handler.interface';
import { User } from '@/users/entities/user.entity';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) ?? [];

    if (policyHandlers.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authenticated user required');
    }

    const ability = this.caslAbilityFactory.createForUser(user);
    const allowed = policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private execPolicyHandler(
    handler: PolicyHandler,
    ability: ReturnType<CaslAbilityFactory['createForUser']>,
  ): boolean {
    if (this.isPolicyHandler(handler)) {
      return handler.handle(ability);
    }
    return handler(ability);
  }

  private isPolicyHandler(handler: PolicyHandler): handler is IPolicyHandler {
    return typeof (handler as IPolicyHandler).handle === 'function';
  }
}
