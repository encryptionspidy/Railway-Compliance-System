# Railway Compliance & Maintenance Management System

A comprehensive, enterprise-grade system designed to digitize and manage railway operations, focusing on driver compliance, asset maintenance, and multi-depot administration.

## 1️⃣ Project Overview

This system solves the critical problem of tracking compliance and maintenance schedules in railway operations. It replaces manual, paper-based tracking with a centralized, digital solution that ensures safety and regulatory compliance.

**Key Capabilities:**
*   **Driver Management:** Tracks profiles, service dates, and mandatory compliance checks (PME, GRS, TR-4, OC).
*   **Asset Maintenance:** Manages Tower Cars and equipment with date-based and usage-based maintenance schedules.
*   **Route Authorization:** Tracks driver route validity with expiry alerts.
*   **Multi-Depot Operations:** Enforces strict data isolation between depots while allowing Super Admin oversight.
*   **Audit & Compliance:** Full audit logging of all mutations, soft deletes for data preservation, and configurable system settings.

**Target Audience:** Railway operational managers, depot administrators, and compliance officers.

## 2️⃣ High-Level Architecture

The system follows a modern, decoupled architecture:

*   **Frontend:** Next.js 14+ (App Router) for a responsive, mobile-first user interface.
*   **Backend:** NestJS (Node.js) providing a robust REST API.
*   **Database:** PostgreSQL with Prisma ORM for type-safe database interactions.
*   **Background Services:** NestJS Scheduler for cron jobs (notifications, status updates).
*   **Infrastructure:** Dockerized environment for consistent deployment.

```mermaid
graph TD
    Client[Next.js Frontend] -->|REST API| API[NestJS Backend]
    API -->|ORM| DB[(PostgreSQL)]
    API -->|SMTP| Email[Email Service]
    Cron[Cron Jobs] -->|Trigger| API
```

## 3️⃣ Core Concepts

### Roles & Permissions
*   **Super Admin:** System-wide access. Can manage all depots, view global audits, and configure system-wide settings. Bootstrapped via environment variables.
*   **Depot Admin:** Operational control restricted to their specific depot. Can manage drivers and assets within their jurisdiction.
*   **Driver:** Read-only access to their own profile and compliance status.

### Depot Isolation
Data isolation is enforced at the repository and service level. A Depot Admin cannot access or modify entities belonging to another depot. This is critical for multi-depot operational security.

### DriverProfile vs. User
*   **User:** Represents authentication credentials (email, password, role).
*   **DriverProfile:** Represents the domain entity (PF Number, Designation, Service Dates).
*   *Note:* A User entity is linked to a DriverProfile, making the driver a first-class domain citizen.

### Data Integrity & Soft Deletes
*   **Soft Deletes:** No primary data is ever permanently deleted. All core entities support `deletedAt` to maintain historical integrity.
*   **Audit Logging:** Every mutation (Create, Update, Delete) is logged with the actor, action, and timestamp.
*   **Timezones:** All timestamps are stored in UTC. The system handles conversion to the configured local timezone (e.g., Asia/Kolkata) for display and logic.

### System Settings
Business logic thresholds (e.g., "Warning days before expiry") are not hardcoded. They are stored in the `SystemSettings` table, allowing dynamic configuration without code deployment.

## 4️⃣ Tech Stack

### Backend
*   **Framework:** NestJS v10
*   **Language:** TypeScript
*   **ORM:** Prisma v5
*   **Auth:** Passport.js + JWT (Access & Refresh Tokens)
*   **Validation:** class-validator + class-transformer
*   **Scheduling:** @nestjs/schedule

### Frontend
*   **Framework:** Next.js v16 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4
*   **Components:** Radix UI (Headless), Lucide React (Icons)
*   **State/Data:** React Server Components, TanStack Table

### Database & Tooling
*   **Database:** PostgreSQL 15+
*   **Containerization:** Docker & Docker Compose
*   **Package Manager:** npm

## 5️⃣ Environment Setup

### Prerequisites
*   Node.js v20+
*   Docker & Docker Compose (recommended) OR Local PostgreSQL 15+

### Environment Variables

**Backend (`backend/.env`)**
```env
# Database Connection
DATABASE_URL="postgresql://railway_user:railway_password@localhost:5432/railway_compliance?schema=public"

# Application Config
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security (CHANGE IN PRODUCTION)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Super Admin Bootstrap
SUPER_ADMIN_EMAIL=admin@railway.com
SUPER_ADMIN_PASSWORD=ChangeThisPassword123!

# Localization
TIMEZONE=Asia/Kolkata

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@railway.com
```

**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 6️⃣ Running the Project (Local)

### 1. Database Setup
Start PostgreSQL using Docker:
```bash
docker-compose up -d postgres
```

### 2. Backend Setup
Initialize the backend, run migrations, and seed the database:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```
*The backend will start on `http://localhost:4000`.*

### 3. Frontend Setup
Start the Next.js development server:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will be available at `http://localhost:3000`.*

## 7️⃣ Authentication & Roles

*   **Login Flow:** Standard email/password login returning a JWT Access Token and a Refresh Token.
*   **Super Admin Bootstrap:** On application startup, the system checks if a Super Admin exists. If not, it creates one using the credentials in `.env`.
*   **Role Enforcement:** `Guards` in NestJS enforce role-based access control (RBAC) on API endpoints.

## 8️⃣ Notifications & Cron Jobs

The system runs daily cron jobs to check for expiring compliance items and maintenance schedules.

*   **Triggers:**
    *   Compliance expiring within `warningDays` (configured in SystemSettings).
    *   Maintenance overdue or approaching due date.
*   **Delivery:**
    *   **In-App:** Notifications stored in the database for user dashboard.
    *   **Email:** Sent via SMTP service (if configured).
*   **Escalation:** Overdue items are flagged for higher-level attention.

## 9️⃣ Audit & Compliance Guarantees

*   **Audit Logs:** The `AuditLog` entity records `entityId`, `entityType`, `action` (CREATE, UPDATE, DELETE), `performedBy`, and `changes` (JSON diff).
*   **Soft Deletes:** Entities are never physically removed. The `deletedAt` field marks them as inactive, preserving the audit trail.
*   **Overrides:** Manual overrides of compliance status are strictly logged with justification.

## 🔟 Extending the System

### Adding New Compliance Types
1.  Update the `ComplianceTypeName` enum in `schema.prisma`.
2.  Run `npx prisma migrate dev`.
3.  Update the frontend forms to include the new type.

### Adding Maintenance Rules
1.  Update `MaintenanceTypeName` in `schema.prisma`.
2.  Configure default intervals in `SystemSettings` (via seed or API).

### Future Proofing
The system is built to be agnostic of specific rule values. Always prefer adding configuration to `SystemSettings` rather than hardcoding values in the codebase.

