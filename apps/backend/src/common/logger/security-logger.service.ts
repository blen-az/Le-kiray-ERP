import { Injectable, Logger } from '@nestjs/common';

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  LOGOUT = 'LOGOUT',
  REFRESH_TOKEN_ROTATED = 'REFRESH_TOKEN_ROTATED',
  RBAC_DENIED = 'RBAC_DENIED',
  CROSS_TENANT_ATTEMPT = 'CROSS_TENANT_ATTEMPT',
  VALIDATION_FAILURE = 'VALIDATION_FAILURE',
  SERVER_ERROR = 'SERVER_ERROR',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  USER_ADMIN_ACTION = 'USER_ADMIN_ACTION',
}

export interface SecurityEventPayload {
  userId?: string;
  email?: string;
  companyId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  reason?: string;
  details?: Record<string, any>;
}

@Injectable()
export class SecurityLoggerService {
  private readonly logger = new Logger('SecurityAudit');

  logSecurityEvent(eventType: SecurityEventType, payload: SecurityEventPayload) {
    const sanitizedPayload = this.sanitize(payload);

    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      ...sanitizedPayload,
    };

    if (
      eventType === SecurityEventType.LOGIN_FAILURE ||
      eventType === SecurityEventType.RBAC_DENIED ||
      eventType === SecurityEventType.CROSS_TENANT_ATTEMPT ||
      eventType === SecurityEventType.ACCOUNT_LOCKED
    ) {
      this.logger.warn(`SECURITY EVENT [${eventType}]: ${JSON.stringify(logEntry)}`);
    } else if (eventType === SecurityEventType.SERVER_ERROR) {
      this.logger.error(`SECURITY EVENT [${eventType}]: ${JSON.stringify(logEntry)}`);
    } else {
      this.logger.log(`SECURITY EVENT [${eventType}]: ${JSON.stringify(logEntry)}`);
    }
  }

  private sanitize(payload: SecurityEventPayload): SecurityEventPayload {
    const sanitized = { ...payload };

    if (sanitized.details) {
      const sanitizedDetails = { ...sanitized.details };
      // Redact sensitive attributes
      delete sanitizedDetails.password;
      delete sanitizedDetails.token;
      delete sanitizedDetails.accessToken;
      delete sanitizedDetails.refreshToken;
      delete sanitizedDetails.nationalIdNumber;
      delete sanitizedDetails.nationalId;
      delete sanitizedDetails.creditCard;

      sanitized.details = sanitizedDetails;
    }

    return sanitized;
  }
}
