import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class DepotGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super Admin bypasses depot checks
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Depot Manager must have depotId
    if (user.role === UserRole.DEPOT_MANAGER && !user.depotId) {
      throw new ForbiddenException('Depot Manager must have depotId assigned');
    }

    return true;
  }
}
