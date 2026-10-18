import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production',
    });
  }

  async validate(payload: { sub: string; companyId: string; email: string; roles: string[]; permissions: string[]; mustChangePassword?: boolean; isPlatformAdmin?: boolean }) {
    return {
      id: payload.sub,
      companyId: payload.companyId,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      mustChangePassword: payload.mustChangePassword === true,
      isPlatformAdmin: payload.isPlatformAdmin === true,
    };
  }
}
