# Pamiri App

A community-driven language learning platform for the Pamiri language, with word contributions, quizzes, XP/streaks, and a leaderboard.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Express 5, TypeScript, Drizzle ORM
- **Database:** PostgreSQL (production) or SQLite (local/fallback)
- **Auth:** Session-based with bcryptjs

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example env file and fill in values:
   ```bash
   cp .env.example .env
   ```
   For local dev, you can leave `DATABASE_URL` empty — it will use SQLite automatically.

3. Start the dev server:
   ```bash
   npm run dev
   ```

The app runs on `http://localhost:5000`.

## Building for Production

```bash
npm run build
```

Output goes to `/dist`. Start the production server with:

```bash
npm start
```

## Database Setup

On first deploy (or after schema changes), run:

```bash
npm run db:push
```

This applies the Drizzle schema to your database.

## Deploying to Render

1. Create a **PostgreSQL** database on Render and copy its **Internal Database URL**.
2. Create a **Web Service** pointing to this repo.
3. Set the following environment variables in the Render dashboard:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `SESSION_SECRET` | a long random string (32+ chars) |
   | `DATABASE_URL` | your Render PostgreSQL internal URL |

4. **Build command:** `npm run build`
5. **Start command:** `node dist/index.cjs`
6. After the first deploy, open the Render shell and run `npm run db:push` once.

## Environment Variables

See `.env.example` for all available variables and their descriptions.
