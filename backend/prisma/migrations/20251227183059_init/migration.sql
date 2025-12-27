-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'DEPOT_MANAGER', 'DRIVER');

-- CreateEnum
CREATE TYPE "ComplianceTypeName" AS ENUM ('PME', 'GRS', 'TR_4', 'OC');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('TOWER_CAR', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "MaintenanceTypeName" AS ENUM ('B_CHECK', 'C_CHECK', 'D_CHECK', 'E_CHECK', 'UT', 'MI', 'BATTERY', 'GENERATOR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "depotId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pfNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "basicPay" INTEGER NOT NULL,
    "dateOfAppointment" TIMESTAMP(3) NOT NULL,
    "dateOfEntry" TIMESTAMP(3) NOT NULL,
    "depotId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_types" (
    "id" TEXT NOT NULL,
    "name" "ComplianceTypeName" NOT NULL,
    "defaultFrequencyMonths" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_compliances" (
    "id" TEXT NOT NULL,
    "driverProfileId" TEXT NOT NULL,
    "complianceTypeId" TEXT NOT NULL,
    "doneDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "frequencyMonths" INTEGER NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_compliances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_sections" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPredefined" BOOLEAN NOT NULL DEFAULT false,
    "depotId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_route_auths" (
    "id" TEXT NOT NULL,
    "driverProfileId" TEXT NOT NULL,
    "routeSectionId" TEXT NOT NULL,
    "authorizedDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_route_auths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "depotId" TEXT NOT NULL,
    "currentHours" INTEGER,
    "lastServiceDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_types" (
    "id" TEXT NOT NULL,
    "name" "MaintenanceTypeName" NOT NULL,
    "defaultIntervalMonths" INTEGER,
    "defaultIntervalHours" INTEGER,
    "isDateBased" BOOLEAN NOT NULL,
    "isUsageBased" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "maintenanceTypeId" TEXT NOT NULL,
    "lastCompletedDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "lastCompletedHours" INTEGER,
    "nextDueHours" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "depotId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_depotId_idx" ON "users"("depotId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_isActive_deletedAt_idx" ON "users"("isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "depots_code_key" ON "depots"("code");

-- CreateIndex
CREATE INDEX "depots_isActive_deletedAt_idx" ON "depots"("isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_userId_key" ON "driver_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_pfNumber_key" ON "driver_profiles"("pfNumber");

-- CreateIndex
CREATE INDEX "driver_profiles_depotId_idx" ON "driver_profiles"("depotId");

-- CreateIndex
CREATE INDEX "driver_profiles_pfNumber_idx" ON "driver_profiles"("pfNumber");

-- CreateIndex
CREATE INDEX "driver_profiles_isActive_deletedAt_idx" ON "driver_profiles"("isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_types_name_key" ON "compliance_types"("name");

-- CreateIndex
CREATE INDEX "compliance_types_isActive_deletedAt_idx" ON "compliance_types"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "driver_compliances_driverProfileId_idx" ON "driver_compliances"("driverProfileId");

-- CreateIndex
CREATE INDEX "driver_compliances_dueDate_idx" ON "driver_compliances"("dueDate");

-- CreateIndex
CREATE INDEX "driver_compliances_isActive_deletedAt_idx" ON "driver_compliances"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "route_sections_depotId_idx" ON "route_sections"("depotId");

-- CreateIndex
CREATE INDEX "route_sections_isPredefined_idx" ON "route_sections"("isPredefined");

-- CreateIndex
CREATE INDEX "route_sections_isActive_deletedAt_idx" ON "route_sections"("isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "route_sections_code_depotId_key" ON "route_sections"("code", "depotId");

-- CreateIndex
CREATE INDEX "driver_route_auths_driverProfileId_idx" ON "driver_route_auths"("driverProfileId");

-- CreateIndex
CREATE INDEX "driver_route_auths_expiryDate_idx" ON "driver_route_auths"("expiryDate");

-- CreateIndex
CREATE INDEX "driver_route_auths_isActive_deletedAt_idx" ON "driver_route_auths"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "assets_depotId_idx" ON "assets"("depotId");

-- CreateIndex
CREATE INDEX "assets_isActive_deletedAt_idx" ON "assets"("isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetNumber_key" ON "assets"("assetNumber");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_types_name_key" ON "maintenance_types"("name");

-- CreateIndex
CREATE INDEX "maintenance_types_isActive_deletedAt_idx" ON "maintenance_types"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "maintenance_schedules_assetId_idx" ON "maintenance_schedules"("assetId");

-- CreateIndex
CREATE INDEX "maintenance_schedules_nextDueDate_idx" ON "maintenance_schedules"("nextDueDate");

-- CreateIndex
CREATE INDEX "maintenance_schedules_isActive_deletedAt_idx" ON "maintenance_schedules"("isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_depotId_idx" ON "audit_logs"("depotId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "depots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "depots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_compliances" ADD CONSTRAINT "driver_compliances_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_compliances" ADD CONSTRAINT "driver_compliances_complianceTypeId_fkey" FOREIGN KEY ("complianceTypeId") REFERENCES "compliance_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sections" ADD CONSTRAINT "route_sections_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "depots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_route_auths" ADD CONSTRAINT "driver_route_auths_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_route_auths" ADD CONSTRAINT "driver_route_auths_routeSectionId_fkey" FOREIGN KEY ("routeSectionId") REFERENCES "route_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "depots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_maintenanceTypeId_fkey" FOREIGN KEY ("maintenanceTypeId") REFERENCES "maintenance_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "depots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
