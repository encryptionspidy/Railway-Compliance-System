import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    if (!user) {
      return next.handle();
    }

    const method = request.method;
    const isMutation = ['POST', 'PATCH', 'DELETE'].includes(method);

    if (!isMutation) {
      return next.handle();
    }

    const entityType = this.getEntityType(request.path);
    let oldValue: any = null;

    // For UPDATE and DELETE, try to get old value
    if (method === 'PATCH' || method === 'DELETE') {
      // This would need to be implemented per endpoint
      // For now, we'll log without old value
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const action = this.getAction(method);
          const entityId = this.getEntityId(request.params, response);

          await this.auditService.log(
            {
              userId: user.id,
              depotId: user.depotId,
              ipAddress: request.ip || request.headers['x-forwarded-for'] as string,
              userAgent: request.headers['user-agent'],
            },
            entityType,
            entityId,
            action,
            oldValue,
            response,
          );
        } catch (error) {
          // Don't break the request if audit logging fails
          this.logger.error('Audit logging error:', error);
        }
      }),
    );
  }

  private getEntityType(path: string): string {
    // Extract entity type from path
    const segments = path.split('/').filter(Boolean);
    return segments[0] || 'Unknown';
  }

  private getAction(method: string): 'CREATE' | 'UPDATE' | 'DELETE' {
    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'UPDATE';
    }
  }

  private getEntityId(params: any, response: any): string {
    if (params.id) {
      return params.id;
    }
    if (response?.id) {
      return response.id;
    }
    return 'unknown';
  }
}
