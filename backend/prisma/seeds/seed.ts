import { PrismaClient, UserRole, ComplianceTypeName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a depot
  const depot = await prisma.depot.upsert({
    where: { code: 'CBE' },
    update: {},
    create: {
      name: 'Coimbatore Depot',
      code: 'CBE',
      address: 'Coimbatore, Tamil Nadu',
    },
  });

  console.log('Created depot:', depot.name);

  // Create a user for the driver
  const driverUser = await prisma.user.upsert({
    where: { email: 'durgadas.k@railway.com' },
    update: {},
    create: {
      email: 'durgadas.k@railway.com',
      passwordHash: await bcrypt.hash('DriverPassword123!', 10),
      role: UserRole.DRIVER,
      depotId: depot.id,
    },
  });

  console.log('Created driver user:', driverUser.email);

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
      depotId: depot.id,
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

  // Create driver compliances
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

  console.log('Created driver compliances');

  // Create route sections (predefined)
  const routeSections = [
    { code: 'CBE-ED', name: 'Coimbatore to Erode', description: 'Main line section' },
    { code: 'ED-SA', name: 'Erode to Salem', description: 'Main line section' },
    { code: 'SA-JTJ', name: 'Salem to Jolarpettai', description: 'Main line section' },
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
    }
  }

  console.log('Created route sections');

  // Create route authorizations
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
