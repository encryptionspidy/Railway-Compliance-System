# Quick Start - What You Need to Do

## ✅ Already Done
- Backend `.env` file created at `backend/.env`
- Frontend `.env.local` file created at `frontend/.env.local`

## ⚠️ Manual Steps Required

### 1. Update Backend .env File

Edit `backend/.env` and change these values:

**REQUIRED CHANGES:**
- `JWT_SECRET`: Generate a strong random string (min 32 characters)
  ```bash
  # You can generate one using:
  openssl rand -base64 32
  ```
- `JWT_REFRESH_SECRET`: Generate another strong random string
- `SUPER_ADMIN_EMAIL`: Your desired admin email
- `SUPER_ADMIN_PASSWORD`: Your desired admin password (min 8 chars, include uppercase, lowercase, number)

**OPTIONAL (for email notifications):**
- `SMTP_USER`: Your email address
- `SMTP_PASSWORD`: Your email app password (for Gmail, use App Password, not regular password)

### 2. Set Up PostgreSQL Database

**Option A: Using Docker (Easiest)**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Verify it's running
docker ps
```

**Option B: Using Local PostgreSQL**
1. Create database:
```sql
CREATE DATABASE railway_compliance;
CREATE USER railway_user WITH PASSWORD 'railway_password';
GRANT ALL PRIVILEGES ON DATABASE railway_compliance TO railway_user;
```

2. If your PostgreSQL uses different credentials, update `DATABASE_URL` in `backend/.env`

### 3. Initialize Database

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed initial data
npm run prisma:seed
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Login

1. Open http://localhost:3000
2. Login with:
   - Email: (value from `SUPER_ADMIN_EMAIL` in `.env`)
   - Password: (value from `SUPER_ADMIN_PASSWORD` in `.env`)

## 🔧 Troubleshooting

**Database connection error?**
- Check PostgreSQL is running: `docker ps` or `pg_isready`
- Verify `DATABASE_URL` in `backend/.env` is correct
- Ensure database exists

**Port already in use?**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Use `npm run dev -- -p 3001`

**Email not working?**
- This is OK - in-app notifications still work
- To enable email: Configure SMTP settings in `backend/.env`

## 📋 Verification

After setup, you should see:
- ✅ Backend running on http://localhost:4000
- ✅ Frontend running on http://localhost:3000
- ✅ Can login with Super Admin credentials
- ✅ Dashboard shows stats
- ✅ Sample driver data visible (Durgadas K)

See `SETUP_GUIDE.md` for detailed instructions.
