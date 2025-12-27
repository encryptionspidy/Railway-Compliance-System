# Setup Guide - Manual Steps Required

## Step 1: Create Backend .env File

Create a file at `backend/.env` with the following content:

```env
# Database
DATABASE_URL="postgresql://railway_user:railway_password@localhost:5432/railway_compliance?schema=public"

# Application
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT - CHANGE THESE IN PRODUCTION!
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Super Admin (created on first startup)
SUPER_ADMIN_EMAIL=admin@railway.com
SUPER_ADMIN_PASSWORD=ChangeThisPassword123!

# Timezone
TIMEZONE=Asia/Kolkata

# SMTP Configuration (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@railway.com
```

**Important**: 
- Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random strings (minimum 32 characters)
- Update `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` to your desired admin credentials
- If using Gmail for SMTP, you'll need an App Password (not your regular password)
- Update `DATABASE_URL` if your PostgreSQL credentials are different

## Step 2: Create Frontend .env.local File

Create a file at `frontend/.env.local` with the following content:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Note**: If your backend runs on a different port, update this URL accordingly.

## Step 3: Set Up PostgreSQL Database

You have two options:

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL using docker-compose
docker-compose up -d postgres

# Wait a few seconds for PostgreSQL to start, then verify
docker ps
```

The database will be available at `localhost:5432` with:
- User: `railway_user`
- Password: `railway_password`
- Database: `railway_compliance`

### Option B: Using Local PostgreSQL

1. Install PostgreSQL 15+ if not already installed
2. Create database and user:
```sql
CREATE DATABASE railway_compliance;
CREATE USER railway_user WITH PASSWORD 'railway_password';
GRANT ALL PRIVILEGES ON DATABASE railway_compliance TO railway_user;
```

3. Update `DATABASE_URL` in `backend/.env` to match your PostgreSQL setup

## Step 4: Initialize Backend

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with initial data
npm run prisma:seed
```

**Note**: The seed script will create:
- A depot (Coimbatore)
- A driver profile (Durgadas K) with sample compliance and route data
- System settings (DUE_SOON_THRESHOLD_DAYS, NOTIFICATION_BEFORE_DAYS, TIMEZONE)

## Step 5: Start Backend

```bash
cd backend
npm run start:dev
```

The backend should start on `http://localhost:4000`

**First startup**: The Super Admin account will be automatically created using the credentials from `.env`

## Step 6: Start Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend should start on `http://localhost:3000`

## Step 7: Login

1. Open `http://localhost:3000` in your browser
2. Login with the Super Admin credentials from your `.env` file:
   - Email: (value of `SUPER_ADMIN_EMAIL`)
   - Password: (value of `SUPER_ADMIN_PASSWORD`)

## Troubleshooting

### Database Connection Issues

If you get database connection errors:
1. Verify PostgreSQL is running: `docker ps` or `pg_isready`
2. Check `DATABASE_URL` in `backend/.env` matches your PostgreSQL setup
3. Ensure database exists: `psql -U railway_user -d railway_compliance -c "SELECT 1;"`

### Port Already in Use

If port 4000 or 3000 is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/package.json` scripts or use `npm run dev -- -p 3001`

### Prisma Migration Errors

If migrations fail:
```bash
cd backend
npx prisma migrate reset  # WARNING: This deletes all data
npx prisma migrate dev
```

### SMTP Email Not Working

Email notifications will fail silently if SMTP is not configured. This is expected behavior - in-app notifications will still work. To enable email:
1. Get an App Password from Gmail (or your email provider)
2. Update `SMTP_USER` and `SMTP_PASSWORD` in `backend/.env`
3. Restart the backend

## Verification Checklist

- [ ] Backend `.env` file created with all variables
- [ ] Frontend `.env.local` file created
- [ ] PostgreSQL database running and accessible
- [ ] Prisma migrations completed successfully
- [ ] Database seeded with initial data
- [ ] Backend starts without errors on port 4000
- [ ] Frontend starts without errors on port 3000
- [ ] Can login with Super Admin credentials
- [ ] Dashboard loads and shows data

## Next Steps After Setup

1. **Create a Depot Manager account**:
   - Use the Super Admin account to create a depot
   - Create a user with role `DEPOT_MANAGER` and assign them to the depot
   - Create a DriverProfile for that user

2. **Configure System Settings**:
   - Login as Super Admin
   - Go to Settings page
   - Adjust `DUE_SOON_THRESHOLD_DAYS` and `NOTIFICATION_BEFORE_DAYS` as needed

3. **Set up SMTP** (optional but recommended):
   - Configure email settings for automated notifications
   - Test email delivery

## Production Deployment Notes

Before deploying to production:

1. **Change all secrets**:
   - Generate strong random strings for `JWT_SECRET` and `JWT_REFRESH_SECRET`
   - Use a secure password for `SUPER_ADMIN_PASSWORD`
   - Update database credentials

2. **Update database URL**:
   - Use production PostgreSQL connection string
   - Ensure SSL is enabled for production databases

3. **Configure SMTP**:
   - Use production email service (SendGrid, AWS SES, etc.)
   - Update SMTP settings accordingly

4. **Environment variables**:
   - Set `NODE_ENV=production`
   - Update `FRONTEND_URL` to production domain
   - Update `NEXT_PUBLIC_API_URL` in frontend to production API URL

5. **Build and deploy**:
   ```bash
   # Backend
   cd backend
   npm run build
   npm run start:prod
   
   # Frontend
   cd frontend
   npm run build
   npm run start
   ```
