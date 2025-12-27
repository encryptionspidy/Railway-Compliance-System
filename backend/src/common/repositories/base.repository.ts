import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export interface UserContext {
  id: string;
  role: UserRole;
  depotId: string | null;
}

export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaService) {}

  /**
   * Apply depot filter to query based on user role
   * CRITICAL: Depot Managers MUST have depotId filter applied
   * Super Admin bypasses depot filter
   * Drivers can only access their own DriverProfile
   */
  protected applyDepotFilter(
    query: any,
    user: UserContext,
    entityDepotField: string = 'depotId',
  ): any {
    // Super Admin can query across all depots
    if (user.role === UserRole.SUPER_ADMIN) {
      return query;
    }

    // Depot Manager MUST be filtered by their depot
    if (user.role === UserRole.DEPOT_MANAGER) {
      if (!user.depotId) {
        throw new Error('Depot Manager must have depotId assigned');
      }
      return {
        ...query,
        [entityDepotField]: user.depotId,
      };
    }

    // Driver can only access their own DriverProfile
    // This is handled at the service level for DriverProfile queries
    return query;
  }

  /**
   * Apply soft delete filter (isActive = true AND deletedAt IS NULL)
   */
  protected applySoftDeleteFilter(query: any): any {
    return {
      ...query,
      isActive: true,
      deletedAt: null,
    };
  }

  /**
   * Apply both depot and soft delete filters
   */
  protected applyFilters(
    query: any,
    user: UserContext,
    entityDepotField: string = 'depotId',
    includeSoftDeleted: boolean = false,
  ): any {
    let filteredQuery = this.applyDepotFilter(query, user, entityDepotField);

    if (!includeSoftDeleted) {
      filteredQuery = this.applySoftDeleteFilter(filteredQuery);
    }

    return filteredQuery;
  }
}
