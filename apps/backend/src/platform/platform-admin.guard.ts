import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Allows only Le’Kiray platform operators. Unlike permission checks, this re-reads the
 * flag from the database on every request, because platform routes cross tenant boundaries
 * and a revoked operator must lose access immediately rather than when their token expires.
 * Must run after JwtAuthGuard.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    if (user.mustChangePassword) {
      throw new ForbiddenException('PASSWORD_CHANGE_REQUIRED');
    }

    const record = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { isPlatformAdmin: true, isActive: true, deletedAt: true },
    });
    if (!record?.isPlatformAdmin || !record.isActive || record.deletedAt) {
      throw new ForbiddenException('Platform administrator access required');
    }
    return true;
  }
}
