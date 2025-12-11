# Database Setup Instructions

## ⚠️ Important: Complete Database Initialization

The Prisma engines need to be downloaded before the database can be used. This is a **one-time setup**.

### Run These Commands (in order):

```bash
# 1. Generate Prisma Client (downloads engines - may take 2-5 minutes)
npx prisma generate

# 2. Push schema to database (creates tables)
npx prisma db push

# 3. Seed database with demo data
npm run db:seed
```

### If Prisma CDN has issues:

If you get 500/404 errors from Prisma's servers, wait 30-60 minutes and try again. This is usually temporary.

### Demo Accounts (after seeding):

- **Admin**: admin@ikri.com / password123
- **Farmer**: farmer@ikri.com / password123
- **Provider**: provider@ikri.com / password123
- **VIP**: vip@ikri.com / password123

### Daily Development Workflow:

```bash
# Start database (if not running)
npm run db:up

# Start Next.js app
npm run dev
```

### Useful Commands:

```bash
npm run db:studio      # Open Prisma Studio (visual database editor)
npm run db:reset       # Reset database and re-seed
npm run db:down        # Stop database container
```

### Troubleshooting:

**Database connection errors?**
- Make sure Docker is running
- Check if PostgreSQL container is up: `docker ps`
- Restart container: `npm run db:down && npm run db:up`

**Prisma Client errors?**
- Make sure you ran `npx prisma generate`
- Restart your dev server after generating

---

## For Teammates

When you clone this repo:

1. Install Docker Desktop
2. Copy `.env.example` to `.env`
3. Run: `npm install`
4. Run: `npm run db:up`
5. Run: `npx prisma generate`
6. Run: `npx prisma db push`
7. Run: `npm run db:seed`
8. Run: `npm run dev`

Done! App runs on http://localhost:3000
