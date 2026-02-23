# IKRI Platform

A Next.js + Capacitor web/mobile platform for sharing agricultural equipment and services.

This repository contains the IKRI MVP (web frontend, server API routes, and mobile wrapper).

Contents in this README
- Project summary
- Quick start (web + mobile)
- Key folders & files
- Important scripts
- Notes about cleanup performed

Project summary
- Frontend: Next.js (App Router) + React (TypeScript)
- Mobile: Capacitor wrapper (Android) to run the web app as a mobile app
- Database: PostgreSQL (used with Prisma ORM)
- Purpose: Connect farmers and equipment providers for offers, demands, reservations, and messaging

Quick start (development)
1. Install dependencies

   npm install

2. Copy environment file

   cp .env.example .env

3. Start database (Docker)

   npm run db:up

4. Generate/prisma and seed (first time)

   npm run db:generate
   npm run db:seed

5. Start dev server (web)

   npm run dev

Open: http://localhost:3000

Mobile (Capacitor) notes
- To sync web build into the Capacitor native project: `npm run mobile:sync`
- Build for mobile and sync: `npm run mobile:build`
- Open Android Studio: `npm run mobile:open:android`
- Run on a connected Android device/emulator: `npm run mobile:run:android`

Key folders & files (high level)
- `app/` – Next.js App Router pages, layout and top-level routes
- `components/` – Reusable React components (dashboards, header, map, forms)
- `services/` – Client-side API helpers and services used by the frontend
- `lib/` – Shared utilities and `prisma` client instance
- `prisma/` – Prisma schema and seed scripts
- `public/` – Static assets (images, icons)
- `android/` – Capacitor Android project (native wrapper)
- `styles/` – global CSS and Tailwind setups

Notable files
- `package.json` – scripts and dependencies
- `tsconfig.json` – TypeScript config
- `docker-compose.yml` – local PostgreSQL service used for development
- `prisma/schema.prisma` – database model definitions

Important npm scripts (from `package.json`)
- `npm run dev` — start Next.js dev server
- `npm run build` — build Next.js app
- `npm run start` — start production server
- `npm run db:up` / `npm run db:down` — start/stop DB via Docker
- `npm run db:seed` — seed demo data
- `npm run db:generate` — run `prisma generate`
- `npm run mobile:sync` / `npm run mobile:build` / `npm run mobile:open:android` — Capacitor mobile workflow

Repository notes and recent cleanup
- I removed six large design/doc PDFs from `code/` as you requested to reduce repo size.
- There are backup files (e.g. `services/apiService.ts.old`) and Android backup folders — consider archiving before permanent deletion if needed.

Developer pointers
- Use `npx prisma studio` (`npm run db:studio`) to inspect the database.
- When changing Prisma models run `npm run db:generate` and `npm run db:migrate` (or `prisma migrate dev`) as needed.
- The Capacitor project lives in `android/`; run `cap sync` after building the web app to update native assets.

If you want, I can:
- create an `archives/` folder and move backups there before deleting
- open a PR with the cleanup and README changes
- produce a short contributor guide for the mobile workflow

— End of summary —
