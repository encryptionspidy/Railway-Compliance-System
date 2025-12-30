# Railway Compliance and Maintenance Management System

A digital system for managing railway driver profiles, compliance tracking, and route authorizations across multiple depots.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Core Concepts](#3-core-concepts)
4. [Tech Stack](#4-tech-stack)
5. [Environment Setup](#5-environment-setup)
6. [Running the Project](#6-running-the-project)
7. [Authentication and Roles](#7-authentication-and-roles)
8. [Notifications](#8-notifications)
9. [Audit and Compliance Guarantees](#9-audit-and-compliance-guarantees)
10. [Phase 2 Roadmap](#10-phase-2-roadmap)

---

## 1. Project Overview

### Purpose

This system digitizes and manages:

- **Driver Profiles**: PF number, designation, service dates, basic pay, and depot assignment
- **Driver Compliance Checks**: PME (Periodic Medical Examination), GRS (General Rules and Safety), TR-4, OC (Operational Certificate), with configurable schedule tracking
- **Route Authorizations**: Track which drivers are authorized for which route sections, with expiry date monitoring
- **Multi-Depot Operations**: Strict data isolation between depots with role-based access control

### Current Scope (Phase 1)

| Feature | Status |
|---------|--------|
| Driver Profile Management | Complete |
| Compliance Tracking | Complete |
| Route Authorization | Complete |
| Multi-Depot Operations | Complete |
| Role-Based Access Control | Complete |
| In-App Notifications | Complete |
| Audit Logging | Complete |
| Asset Maintenance | **Paused** (Backend ready, UI hidden) |
| Email Notifications | **Paused** (Backend ready, not configured) |

### Target Users

| Role | Description |
|------|-------------|
| Super Admin | Railway zone/division level administrator with global access |
| Depot Manager | Individual depot administrator with depot-scoped access |
| Driver | Railway tower car/inspection vehicle operator with read-only access to own data |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16 / React 19)                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │   App Router  │  Tailwind CSS  │  shadcn/ui  │  TanStack Table │  │
│  │   Axios (API Client)  │  date-fns (Date utilities)            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                          http://localhost:3000                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ REST API + JWT Authentication
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (NestJS 10)                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Controllers  │  Services  │  Guards  │  Interceptors  │  Cron │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                          http://localhost:4000                       │
│                                  │                                   │
│                          Prisma ORM                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     POSTGRESQL 15 DATABASE                          │
│                          localhost:5433                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. User authenticates via `/auth/login`, receives JWT tokens
2. Frontend includes `Authorization: Bearer <token>` header
3. Backend validates JWT, extracts user context
4. Guards enforce role-based access
5. Services apply depot filtering for non-Super Admin users
6. All mutations are logged via AuditInterceptor

---

## 3. Core Concepts

### 3.1 Roles and Permissions

| Role | Scope | Create | Read | Update | Delete |
|------|-------|--------|------|--------|--------|
| SUPER_ADMIN | Global | All entities | All entities | All entities | Soft delete all |
| DEPOT_MANAGER | Own depot | Drivers, compliance, routes | Depot-scoped data | Depot-scoped data | Soft delete in depot |
| DRIVER | Own data | None | Own profile, compliance, routes | None | None |

### 3.2 DriverProfile vs User

- **User**: Authentication entity (email, password, role, depotId)
- **DriverProfile**: Domain entity linked 1:1 to a User (PF number, designation, service dates)

This separation enables admins without driver profiles.

### 3.3 Depot Isolation

All data access for DEPOT_MANAGER and DRIVER roles is filtered by depot at the service layer.

### 3.4 Soft Delete Strategy

All core entities implement soft deletes:
- `isActive: false` and `deletedAt` timestamp set on delete
- All queries filter by `isActive: true` and `deletedAt: null`
- Deleted records can be recreated (reactivated) with same email/PF

---

## 4. Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 16 | React framework with App Router |
| UI | Tailwind CSS + shadcn/ui | Styling and components |
| Backend | NestJS 10 | TypeScript API framework |
| ORM | Prisma 5 | Database access and migrations |
| Database | PostgreSQL 15 | Primary data store |
| Container | Docker | Database containerization |

---

## 5. Environment Setup

### Prerequisites

1. **Node.js 20.x LTS** - [nodejs.org](https://nodejs.org/)
2. **Docker Desktop** - [docker.com](https://www.docker.com/products/docker-desktop)
3. **Git** - [git-scm.com](https://git-scm.com/)

### Clone and Configure

```bash
git clone <repository-url>
cd "Tower car driver"

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env if needed

# Frontend environment (optional, defaults work for local dev)
cp frontend/.env.example frontend/.env.local
```

---

## 6. Running the Project

### First Time Setup

```bash
# 1. Start PostgreSQL database
docker compose up -d postgres

# 2. Setup backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# 3. Setup frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Regular Startup

```bash
# Terminal 1 - Database
docker compose up -d postgres

# Terminal 2 - Backend
cd backend && npm run start:dev

# Terminal 3 - Frontend
cd frontend && npm run dev
```

### Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Database Browser**: `cd backend && npx prisma studio` (opens http://localhost:5555)

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@railway.com | ChangeThisPassword123! |
| Depot Manager (CBE) | admin-cbe@railway.com | DepotManager123! |
| Depot Manager (ED) | admin-ed@railway.com | DepotManager123! |
| Depot Manager (SA) | admin-sa@railway.com | DepotManager123! |
| Sample Driver | durgadas.k@railway.com | DriverPassword123! |

---

## 7. Authentication and Roles

### Login Flow

1. POST `/auth/login` with `{ email, password }`
2. Returns `{ accessToken, refreshToken, user }`
3. Frontend stores tokens in localStorage
4. Token auto-refresh on 401 response

### Role Behaviors

- **Super Admin**: Full access to all depots, can create admins and drivers
- **Depot Manager**: Scoped to their depot, can manage drivers and compliance
- **Driver**: Read-only access to own data

---

## 8. Notifications

### Current Implementation

In-app notifications for:
- Compliance due soon (configurable threshold)
- Compliance overdue
- Route authorization expiring/expired

Notifications are generated via scheduled tasks (cron).

### Email Notifications

Backend is ready but requires SMTP configuration in `.env`.

---

## 9. Audit and Compliance Guarantees

### What is Logged

All create, update, and delete operations log:
- User who performed the action
- Timestamp
- Before and after values

### Soft Deletes

- Data is never permanently deleted
- Deleted records can be reactivated
- Historical report accuracy maintained

---

## 10. Phase 2 Roadmap

Features planned for Phase 2:

1. **Asset Maintenance Management**
   - Tower car tracking
   - Usage-based maintenance schedules
   - Backend is ready, UI needs implementation

2. **Email Notifications**
   - Configure SMTP
   - Enable scheduled email delivery

3. **Reporting**
   - Compliance reports
   - Route authorization status reports
   - Export to PDF/Excel

4. **Advanced Filtering**
   - Date range filters
   - Multi-select filters

---

## Project Structure

```
Tower car driver/
├── docker-compose.yml        # PostgreSQL container
├── README.md                 # This file
├── backend/
│   ├── .env.example          # Environment template
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seeds/seed.ts     # Initial data
│   └── src/                  # NestJS application
└── frontend/
    ├── .env.example          # Environment template
    ├── app/                  # Next.js pages
    ├── components/           # React components
    └── lib/                  # Utilities
```

---

## Troubleshooting

### Cannot connect to database

```bash
docker compose ps           # Check container status
docker compose restart postgres
```

### Port already in use

```bash
lsof -i :4000  # or :3000
kill -9 <PID>
```

### Reset database

```bash
cd backend
npx prisma migrate reset    # WARNING: Deletes all data
```

### Login returns 401

1. Verify correct credentials
2. Check user exists: `npx prisma studio`
3. Re-run seed: `npx prisma db seed`

### Mobile/Device Testing on Same Network

To test from a mobile device or another computer on the same network:

1. Find your computer's IP address:
   ```bash
   # Linux/Mac
   hostname -I | awk '{print $1}'
   # or
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```

2. Update frontend environment to use your IP:
   ```bash
   # frontend/.env.local
   NEXT_PUBLIC_API_URL=http://YOUR_IP:4000
   ```

3. Restart the frontend:
   ```bash
   cd frontend && npm run dev
   ```

4. Access from mobile: `http://YOUR_IP:3000`

Note: Both frontend (3000) and backend (4000) must be accessible from the network.

---

## License

Internal use only. Not for distribution.

