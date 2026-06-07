import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '@/modules/users/users.service';
import { AuditService } from '@/modules/audit/audit.service';
import type { User, UserRecord } from '@/modules/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

interface RefreshJwtPayload {
  sub: string;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserRecord | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user?.isActive) {
      return null;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return null;
    }
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Write login event to append-only audit log
    await this.auditService.create({
      userId: user.id,
      action: 'LOGIN',
      module: 'Auth',
      newData: { description: `${user.fullName} logged in successfully` },
    });

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    let payload: RefreshJwtPayload;
    try {
      payload = this.jwtService.verify<RefreshJwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.buildAuthResponse(this.usersService.sanitize(user));
  }

  buildAuthResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.signRefreshToken(user.id);
    return {
      accessToken,
      refreshToken,
      user: this.usersService.sanitize(user),
    };
  }

  private signRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: 'refresh' } satisfies RefreshJwtPayload,
      {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: (this.config.get<string>('jwt.refreshExpiresIn') ??
          '7d') as `${number}d`,
      },
    );
  }
}
