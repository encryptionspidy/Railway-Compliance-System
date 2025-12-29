import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('Starting duplicate cleanup...');

  // Clean up duplicate driver compliances
  // Keep only the first (oldest) record for each driver + compliance type combination
  const complianceDuplicates = await prisma.$queryRaw<{ driverProfileId: string; complianceTypeId: string; count: number }[]>`
    SELECT "driverProfileId", "complianceTypeId", COUNT(*) as count
    FROM driver_compliances
    WHERE "isActive" = true AND "deletedAt" IS NULL
    GROUP BY "driverProfileId", "complianceTypeId"
    HAVING COUNT(*) > 1
  `;

  console.log(`Found ${complianceDuplicates.length} compliance type(s) with duplicates`);

  for (const dup of complianceDuplicates) {
    // Get all records for this combination, ordered by creation date
    const records = await prisma.driverCompliance.findMany({
      where: {
        driverProfileId: dup.driverProfileId,
        complianceTypeId: dup.complianceTypeId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Keep the first one, soft delete the rest
    const [keep, ...remove] = records;
    console.log(`  Keeping compliance ${keep.id}, removing ${remove.length} duplicates`);

    for (const record of remove) {
      await prisma.driverCompliance.update({
        where: { id: record.id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
    }
  }

  // Clean up duplicate route authorizations
  // Keep only the first (oldest) record for each driver + route section combination
  const routeAuthDuplicates = await prisma.$queryRaw<{ driverProfileId: string; routeSectionId: string; count: number }[]>`
    SELECT "driverProfileId", "routeSectionId", COUNT(*) as count
    FROM driver_route_auths
    WHERE "isActive" = true AND "deletedAt" IS NULL
    GROUP BY "driverProfileId", "routeSectionId"
    HAVING COUNT(*) > 1
  `;

  console.log(`Found ${routeAuthDuplicates.length} route section(s) with duplicates`);

  for (const dup of routeAuthDuplicates) {
    // Get all records for this combination, ordered by creation date
    const records = await prisma.driverRouteAuth.findMany({
      where: {
        driverProfileId: dup.driverProfileId,
        routeSectionId: dup.routeSectionId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Keep the first one, soft delete the rest
    const [keep, ...remove] = records;
    console.log(`  Keeping route auth ${keep.id}, removing ${remove.length} duplicates`);

    for (const record of remove) {
      await prisma.driverRouteAuth.update({
        where: { id: record.id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
    }
  }

  console.log('Duplicate cleanup completed!');
}

cleanupDuplicates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

