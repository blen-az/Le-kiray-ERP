import { Injectable, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { SecurityLoggerService, SecurityEventType } from '../common/logger/security-logger.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private securityLogger: SecurityLoggerService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
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
      },
    });

    if (!user || user.deletedAt) {
      this.securityLogger.logSecurityEvent(SecurityEventType.LOGIN_FAILURE, {
        email,
        reason: 'User not found or deleted',
      });
      throw new NotFoundException('User not found');
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

      throw new UnauthorizedException('Invalid credentials');
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

    // Extract flat list of role names and actions/permissions
    const roles = user.roles.map((ur) => ur.role.name);
    
    const permissionSet = new Set<string>();
    user.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        if (rp.permission.action) {
          permissionSet.add(rp.permission.action);
        }
      });
    });

    const permissions = Array.from(permissionSet);

    this.securityLogger.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return {
      ...result,
      roles,
      permissions,
    };
  }

  async generateTokens(userId: string, companyId: string, email: string, roles: string[], permissions: string[]) {
    const payload = {
      sub: userId,
      companyId,
      email,
      roles,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN || '15m') as any,
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as any,
      secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_change_me',
    });

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash(refreshToken, rounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    const tokens = await this.generateTokens(
      user.id,
      user.companyId,
      user.email,
      user.roles,
      user.permissions,
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
        roles: user.roles,
        permissions: user.permissions,
      },
    };
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
        include: {
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
        },
      });

      if (!user || user.deletedAt || !user.refreshToken) {
        throw new UnauthorizedException('Access Denied: Invalid Session');
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isMatch) {
        throw new UnauthorizedException('Access Denied: Invalid Session');
      }

      // Re-flatten roles & permissions to ensure they are fresh
      const roles = user.roles.map((ur) => ur.role.name);
      
      const permissionSet = new Set<string>();
      user.roles.forEach((ur) => {
        ur.role.permissions.forEach((rp) => {
          if (rp.permission.action) {
            permissionSet.add(rp.permission.action);
          }
        });
      });
      const permissions = Array.from(permissionSet);

      const tokens = await this.generateTokens(user.id, user.companyId, user.email, roles, permissions);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      this.securityLogger.logSecurityEvent(SecurityEventType.REFRESH_TOKEN_ROTATED, {
        userId: user.id,
        companyId: user.companyId,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyId: user.companyId,
          roles,
          permissions,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
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
    const { password, ...result } = user;
    return result;
  }
}
