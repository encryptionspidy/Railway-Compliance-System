import { PrismaClient, UserRole, ComplianceTypeName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create all depots
  const depotData = [
    { code: 'CBE', name: 'Coimbatore Depot', address: 'Coimbatore, Tamil Nadu' },
    { code: 'ED', name: 'Erode Depot', address: 'Erode, Tamil Nadu' },
    { code: 'SA', name: 'Salem Depot', address: 'Salem, Tamil Nadu' },
  ];

  const depots: Record<string, any> = {};

  for (const depot of depotData) {
    depots[depot.code] = await prisma.depot.upsert({
      where: { code: depot.code },
      update: { name: depot.name, address: depot.address },
      create: depot,
    });
    console.log('Created/updated depot:', depot.name);
  }

  // Create a user for the driver (update password hash to ensure login works)
  const driverPasswordHash = await bcrypt.hash('DriverPassword123!', 10);
  const driverUser = await prisma.user.upsert({
    where: { email: 'durgadas.k@railway.com' },
    update: {
      passwordHash: driverPasswordHash,
    },
    create: {
      email: 'durgadas.k@railway.com',
      passwordHash: driverPasswordHash,
      role: UserRole.DRIVER,
      depotId: depots['CBE'].id,
    },
  });

  console.log('Created driver user:', driverUser.email);

  // Create/update Depot Managers for each depot
  const depotManagerPasswordHash = await bcrypt.hash('DepotManager123!', 10);

  const depotManagerData = [
    { email: 'admin-cbe@railway.com', depotCode: 'CBE' },
    { email: 'admin-ed@railway.com', depotCode: 'ED' },
    { email: 'admin-sa@railway.com', depotCode: 'SA' },
  ];

  for (const dm of depotManagerData) {
    const existingManager = await prisma.user.findUnique({
      where: { email: dm.email },
    });

    if (existingManager) {
      await prisma.user.update({
        where: { email: dm.email },
        data: { passwordHash: depotManagerPasswordHash },
      });
      console.log('Updated depot manager password:', dm.email);
    } else {
      await prisma.user.create({
        data: {
          email: dm.email,
          passwordHash: depotManagerPasswordHash,
          role: UserRole.DEPOT_MANAGER,
          depotId: depots[dm.depotCode].id,
        },
      });
      console.log('Created depot manager:', dm.email);
    }
  }

  // Create driver profile (from provided mock data)
  const driverProfile = await prisma.driverProfile.upsert({
    where: { pfNumber: '15629802390' },
    update: {},
    create: {
      userId: driverUser.id,
      pfNumber: '15629802390',
      driverName: 'Durgadas K',
      designation: 'TWD / PTJ (Tech-I / OHE / PTJ)',
      basicPay: 32900,
      dateOfAppointment: new Date('2018-02-28'),
      dateOfEntry: new Date('2022-01-27'),
      depotId: depots['CBE'].id,
    },
  });

  console.log('Created driver profile:', driverProfile.driverName);

  // Create compliance types
  const complianceTypes = await Promise.all([
    prisma.complianceType.upsert({
      where: { name: ComplianceTypeName.PME },
      update: {},
      create: {
        name: ComplianceTypeName.PME,
        defaultFrequencyMonths: 48,
      },
    }),
    prisma.complianceType.upsert({
      where: { name: ComplianceTypeName.GRS },
      update: {},
      create: {
        name: ComplianceTypeName.GRS,
        defaultFrequencyMonths: 36,
      },
    }),
    prisma.complianceType.upsert({
      where: { name: ComplianceTypeName.TR_4 },
      update: {},
      create: {
        name: ComplianceTypeName.TR_4,
        defaultFrequencyMonths: 36,
      },
    }),
    prisma.complianceType.upsert({
      where: { name: ComplianceTypeName.OC },
      update: {},
      create: {
        name: ComplianceTypeName.OC,
        defaultFrequencyMonths: 6,
      },
    }),
  ]);

  console.log('Created compliance types');

  // Create driver compliances (check for existing to avoid duplicates)
  const compliances = [
    {
      type: ComplianceTypeName.PME,
      doneDate: '2023-04-04',
      dueDate: '2027-04-03',
      frequencyMonths: 48,
    },
    {
      type: ComplianceTypeName.GRS,
      doneDate: '2024-11-30',
      dueDate: '2027-11-29',
      frequencyMonths: 36,
    },
    {
      type: ComplianceTypeName.TR_4,
      doneDate: '2025-01-22',
      dueDate: '2028-01-21',
      frequencyMonths: 36,
    },
    {
      type: ComplianceTypeName.OC,
      doneDate: '2025-11-29',
      dueDate: '2026-05-28',
      frequencyMonths: 6,
    },
  ];

  for (const comp of compliances) {
    const complianceType = complianceTypes.find((ct) => ct.name === comp.type);
    if (complianceType) {
      // Check if compliance already exists for this driver and type
      const existingCompliance = await prisma.driverCompliance.findFirst({
        where: {
          driverProfileId: driverProfile.id,
          complianceTypeId: complianceType.id,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!existingCompliance) {
        await prisma.driverCompliance.create({
          data: {
            driverProfileId: driverProfile.id,
            complianceTypeId: complianceType.id,
            doneDate: new Date(comp.doneDate),
            dueDate: new Date(comp.dueDate),
            frequencyMonths: comp.frequencyMonths,
          },
        });
      }
    }
  }

  console.log('Created driver compliances');

  // Create route sections (predefined - all predefined sections are shared across depots)
  // Each route is associated with the depots it connects
  const routeSections = [
    // Coimbatore Depot routes
    { code: 'CBE-ED', name: 'Coimbatore to Erode', description: 'CBE Division main line', depots: ['CBE', 'ED'] },
    { code: 'CBE-PGT', name: 'Coimbatore to Palakkad', description: 'CBE Division Kerala section', depots: ['CBE'] },
    // Erode Depot routes
    { code: 'ED-SA', name: 'Erode to Salem', description: 'ED-SA Division main line', depots: ['ED', 'SA'] },
    { code: 'ED-TPJ', name: 'Erode to Tiruchirapalli', description: 'ED Division branch line', depots: ['ED'] },
    // Salem Depot routes
    { code: 'SA-JTJ', name: 'Salem to Jolarpettai', description: 'SA Division main line', depots: ['SA'] },
    { code: 'SA-TPJ', name: 'Salem to Tiruchirapalli', description: 'SA Division main line', depots: ['SA'] },
    { code: 'SA-VRI', name: 'Salem to Virudhunagar', description: 'SA Division branch line', depots: ['SA'] },
  ];

  for (const section of routeSections) {
    const existing = await prisma.routeSection.findFirst({
      where: {
        code: section.code,
        isPredefined: true,
        depotId: null,
      },
    });

    if (!existing) {
      await prisma.routeSection.create({
        data: {
          code: section.code,
          name: section.name,
          description: section.description,
          isPredefined: true,
          depotId: null,
        },
      });
      console.log('Created route section:', section.code, '-', section.name);
    } else {
      // Update description if exists
      await prisma.routeSection.update({
        where: { id: existing.id },
        data: { description: section.description },
      });
    }
  }

  console.log('Created route sections');

  // Create route authorizations (check for existing to avoid duplicates)
  const routeAuths = [
    { section: 'CBE-ED', authorizedDate: '2025-10-08', expiryDate: '2026-01-07' },
    { section: 'ED-SA', authorizedDate: '2025-09-29', expiryDate: '2025-12-28' },
    { section: 'SA-JTJ', authorizedDate: '2025-12-24', expiryDate: '2026-03-23' },
  ];

  for (const auth of routeAuths) {
    const section = await prisma.routeSection.findFirst({
      where: { code: auth.section, isPredefined: true },
    });
    if (section) {
      // Check if authorization already exists for this driver and section
      const existingAuth = await prisma.driverRouteAuth.findFirst({
        where: {
          driverProfileId: driverProfile.id,
          routeSectionId: section.id,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!existingAuth) {
        await prisma.driverRouteAuth.create({
          data: {
            driverProfileId: driverProfile.id,
            routeSectionId: section.id,
            authorizedDate: new Date(auth.authorizedDate),
            expiryDate: new Date(auth.expiryDate),
          },
        });
      }
    }
  }

  console.log('Created route authorizations');

  // Create system settings
  await prisma.systemSetting.upsert({
    where: { key: 'DUE_SOON_THRESHOLD_DAYS' },
    update: {},
    create: {
      key: 'DUE_SOON_THRESHOLD_DAYS',
      value: '7',
      description: 'Number of days before due date to show amber warning',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'NOTIFICATION_BEFORE_DAYS' },
    update: {},
    create: {
      key: 'NOTIFICATION_BEFORE_DAYS',
      value: '2',
      description: 'Number of days before due date to send notification',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'TIMEZONE' },
    update: {},
    create: {
      key: 'TIMEZONE',
      value: 'Asia/Kolkata',
      description: 'Default timezone for date display',
    },
  });

  console.log('Created system settings');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

