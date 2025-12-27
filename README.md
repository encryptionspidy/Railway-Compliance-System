# Railway Compliance & Maintenance Management System

Enterprise-grade railway compliance and maintenance management system with strict role-based access, depot isolation, audit logging, and mobile-first UI.

## Architecture

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: PostgreSQL
- **Authentication**: JWT (access + refresh tokens)

## Key Features

- ✅ DriverProfile as first-class entity (not just User)
- ✅ Query-level depot isolation (enforced at repository layer)
- ✅ Soft delete strategy (all entities)
- ✅ Configurable system settings (no hardcoded thresholds)
- ✅ UTC timestamp storage with timezone-aware display
- ✅ Derived status fields (never stored)
- ✅ Comprehensive audit logging
- ✅ Automated notifications (in-app + email)
- ✅ Daily cron jobs for due date reminders
- ✅ Mobile-first responsive UI

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker (optional, for containerized setup)

### Backend Setup

```bash
cd backend
npm install
# Create .env file with required variables (see Environment Variables section)
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

The backend will be available at `http://localhost:4000`

### Frontend Setup

```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Docker Setup

```bash
docker-compose up -d
```

This will start both PostgreSQL and the backend service.

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/railway_compliance"
PORT=4000
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
SUPER_ADMIN_EMAIL=admin@railway.com
SUPER_ADMIN_PASSWORD=ChangeThisPassword123!
TIMEZONE=Asia/Kolkata
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## User Roles

- **SUPER_ADMIN**: Global access, can manage all depots
- **DEPOT_MANAGER**: Bound to one depot, can manage drivers and compliance
- **DRIVER**: Read-only, can view own compliance and routes

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token

### Driver Profiles
- `GET /driver-profiles` - List driver profiles (filtered by role/depot)
- `GET /driver-profiles/:id` - Get driver profile details
- `POST /driver-profiles` - Create driver profile (Super Admin, Depot Manager)
- `PATCH /driver-profiles/:id` - Update driver profile
- `DELETE /driver-profiles/:id` - Soft delete driver profile
- `GET /driver-profiles/:id/compliance` - Get driver's compliances
- `GET /driver-profiles/:id/route-auth` - Get driver's route authorizations

### Compliance
- `GET /driver-compliance` - List compliances (filtered by role/depot)
- `GET /driver-compliance/:id` - Get compliance details
- `POST /driver-compliance` - Create compliance record
- `PATCH /driver-compliance/:id` - Update compliance
- `DELETE /driver-compliance/:id` - Soft delete compliance
- `GET /driver-compliance/types` - List compliance types

### Route Authorization
- `GET /route-auth` - List route authorizations
- `GET /route-auth/sections` - List route sections
- `POST /route-auth/sections` - Create custom route section
- `POST /route-auth` - Create route authorization
- `GET /route-auth/expiring` - Get expiring authorizations

### Assets & Maintenance
- `GET /assets` - List assets (filtered by depot)
- `POST /assets` - Create asset
- `GET /maintenance` - List maintenance schedules
- `POST /maintenance` - Create maintenance schedule
- `GET /maintenance/types` - List maintenance types

### System Settings (Super Admin only)
- `GET /system-settings` - List all settings
- `GET /system-settings/:key` - Get specific setting
- `PATCH /system-settings/:key` - Update setting

### Notifications
- `GET /notifications` - Get user notifications
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/read-all` - Mark all as read

### Audit (Super Admin only)
- `GET /audit` - Get audit logs with filtering

## Database Schema

See `backend/prisma/schema.prisma` for complete schema definition.

Key entities:
- User (authentication)
- DriverProfile (first-class entity)
- DriverCompliance
- DriverRouteAuth
- Asset
- MaintenanceSchedule
- SystemSetting
- Notification
- AuditLog

## Development

```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev

# Database migrations
cd backend
npx prisma migrate dev
npx prisma studio  # GUI for database
```

## Testing

```bash
# Backend tests
cd backend
npm test

# E2E tests
npm run test:e2e
```

## UI/UX Design

The frontend follows enterprise-grade design principles:
- **Restrained aesthetics**: No excessive blur, gradients, or decorative elements
- **Information-dense**: Prioritizes data clarity over visual flair
- **Mobile-first**: Cards on mobile, tables on desktop
- **Accessible**: WCAG AA compliant with proper focus states and ARIA labels
- **Professional tone**: Neutral, operational communication

See `UI_DESIGN_DECISIONS.md` for detailed design rationale.

## Production Deployment

1. Build backend: `cd backend && npm run build`
2. Build frontend: `cd frontend && npm run build`
3. Run migrations: `npx prisma migrate deploy`
4. Start services: `npm run start:prod`

## Security

- All authorization checks are server-side
- Depot isolation enforced at database query level
- JWT tokens with short expiration
- Password hashing with bcrypt (10 rounds)
- Input validation on all endpoints
- Audit trail for all mutations

## License

Proprietary - Railway Operations Use Only
