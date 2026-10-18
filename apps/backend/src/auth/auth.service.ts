import { Injectable, UnauthorizedException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { SecurityLoggerService, SecurityEventType } from '../common/logger/security-logger.service';

const USER_WITH_PERMISSIONS = {
  company: { select: { name: true, status: true, deletedAt: true } },
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} as const;

/** Same message for unknown email and wrong password, so login can't be used to discover accounts */
const INVALID_CREDENTIALS = 'Invalid email or password';

// Compared against when the email is unknown, so both paths take the same time
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 10);

/**
 * Refresh tokens are JWTs whose first 72+ bytes are identical for a given user, and bcrypt
 * only reads 72 bytes — so bcrypt would accept any older token. A SHA-256 digest covers
 * the whole token; the token itself is already high-entropy, so no slow hash is needed.
 */
function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function refreshTokenMatches(token: string, storedHash: string): boolean {
  const a = Buffer.from(hashRefreshToken(token), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private securityLogger: SecurityLoggerService,
  ) {}

  /** Flattens role names and the union of their permissions */
  private flattenAccess(user: { roles: { role: { name: string; permissions: { permission: { action: string } }[] } }[] }) {
    const roles = user.roles.map((ur) => ur.role.name);
    const permissionSet = new Set<string>();
    user.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        if (rp.permission.action) {
          permissionSet.add(rp.permission.action);
        }
      });
    });
    return { roles, permissions: Array.from(permissionSet) };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    // Case-insensitive so "Name@Company.com" and "name@company.com" are the same login
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
      include: USER_WITH_PERMISSIONS,
    });

    if (!user || user.deletedAt) {
      await bcrypt.compare(pass, DUMMY_PASSWORD_HASH);
      this.securityLogger.logSecurityEvent(SecurityEventType.LOGIN_FAILURE, {
        email,
        reason: 'User not found or deleted',
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Check account lockout status
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      this.securityLogger.logSecurityEvent(SecurityEventType.ACCOUNT_LOCKED, {
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        reason: `Account locked for ${remainingMinutes} more minutes`,
      });
      throw new ForbiddenException(`Account locked due to repeated failed logins. Please try again in ${remainingMinutes} minutes.`);
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      const newFailedCount = (user.failedLoginCount || 0) + 1;
      let lockedUntil: Date | null = null;
      const MAX_LOGIN_ATTEMPTS = parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10);

      if (newFailedCount >= MAX_LOGIN_ATTEMPTS) {
        // Lock account for 15 minutes after max failed attempts
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: newFailedCount,
          lockedUntil,
        },
      });

      this.securityLogger.logSecurityEvent(SecurityEventType.LOGIN_FAILURE, {
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        reason: `Invalid password. Attempt ${newFailedCount}/${MAX_LOGIN_ATTEMPTS}`,
      });

      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Only reveal suspension/deactivation to someone who knows the password
    if (user.company.status !== 'Active' || user.company.deletedAt) {
      this.securityLogger.logSecurityEvent(SecurityEventType.LOGIN_FAILURE, {
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        reason: `Company ${user.company.status}`,
      });
      throw new ForbiddenException('Your company account is suspended. Please contact Le’Kiray support.');
    }

    if (!user.isActive) {
      this.securityLogger.logSecurityEvent(SecurityEventType.LOGIN_FAILURE, {
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        reason: 'Account deactivated',
      });
      throw new ForbiddenException('This account has been deactivated. Contact your administrator.');
    }

    // Successful authentication: Reset failed count & lock, update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const { roles, permissions } = this.flattenAccess(user);

    this.securityLogger.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...result } = user;
    return {
      ...result,
      roles,
      permissions,
    };
  }

  async generateTokens(
    userId: string,
    companyId: string,
    email: string,
    roles: string[],
    permissions: string[],
    mustChangePassword = false,
    isPlatformAdmin = false,
  ) {
    const payload = {
      sub: userId,
      companyId,
      email,
      roles,
      permissions,
      mustChangePassword,
      isPlatformAdmin,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN || '15m') as any,
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production',
    });

    // jti makes every refresh token unique, even two issued within the same second,
    // so rotation always invalidates the previous token
    const refreshToken = this.jwtService.sign({ ...payload, jti: randomUUID() }, {
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as any,
      secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_change_me',
    });

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashRefreshToken(refreshToken) },
    });
  }

  /** Issues tokens and the client-facing user summary for an authenticated user */
  private async issueSession(user: {
    id: string;
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    mustChangePassword: boolean;
    isPlatformAdmin: boolean;
    company?: { name: string } | null;
    roles: string[];
    permissions: string[];
  }) {
    const tokens = await this.generateTokens(
      user.id,
      user.companyId,
      user.email,
      user.roles,
      user.permissions,
      user.mustChangePassword,
      user.isPlatformAdmin,
    );

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        company: user.company ? { name: user.company.name } : undefined,
        roles: user.roles,
        permissions: user.permissions,
        mustChangePassword: user.mustChangePassword,
        isPlatformAdmin: user.isPlatformAdmin,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    return this.issueSession(user);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    this.securityLogger.logSecurityEvent(SecurityEventType.LOGOUT, {
      userId,
    });
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_change_me',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: USER_WITH_PERMISSIONS,
      });

      if (!user || user.deletedAt || !user.isActive || !user.refreshToken || user.company.status !== 'Active' || user.company.deletedAt) {
        throw new UnauthorizedException('Access Denied: Invalid Session');
      }

      if (!refreshTokenMatches(refreshToken, user.refreshToken)) {
        throw new UnauthorizedException('Access Denied: Invalid Session');
      }

      // Re-flatten roles & permissions to ensure they are fresh
      const { roles, permissions } = this.flattenAccess(user);
      const session = await this.issueSession({ ...user, roles, permissions });

      this.securityLogger.logSecurityEvent(SecurityEventType.REFRESH_TOKEN_ROTATED, {
        userId: user.id,
        companyId: user.companyId,
      });

      return session;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: USER_WITH_PERMISSIONS,
    });
    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Access Denied: Invalid Session');
    }

    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: await bcrypt.hash(dto.newPassword, rounds),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    this.securityLogger.logSecurityEvent(SecurityEventType.PASSWORD_CHANGED, {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
    });

    // New session replaces any other device's refresh token
    const { roles, permissions } = this.flattenAccess(user);
    return this.issueSession({ ...user, mustChangePassword: false, roles, permissions });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User profile not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, failedLoginCount, lockedUntil, refreshTokenVersion, ...result } = user;
    return result;
  }
}
