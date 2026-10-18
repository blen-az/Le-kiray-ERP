import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Users holding an admin-issued temporary password can only reach /auth endpoints
    const request = context.switchToHttp().getRequest();
    if (request.user?.mustChangePassword) {
      throw new ForbiddenException('PASSWORD_CHANGE_REQUIRED');
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Super Admin bypasses permission checks
    if (user.roles?.includes('Super Admin')) {
      return true;
    }

    return requiredPermissions.every((permission) =>
      user.permissions?.includes(permission),
    );
  }
}
