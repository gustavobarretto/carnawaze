# Carnawaze — Carnaval Trios (hedone-fe + hedone-be)

Mobile-first app for reporting electric trio (trio elétrico) locations during Carnival in Salvador. Users pin artist locations on a map; pins are aggregated with space-time weighting. Built from the SDD (Specification Driven Development) document.

## Structure

- **apps/hedone-be** — Backend (Fastify, Prisma, SQLite), REST API, JWT auth
- **apps/hedone-fe** — Frontend (Expo React Native), mobile-first, works on web
- **packages/shared** — Shared TypeScript types

## Prerequisites

- Node.js 18+
- Yarn

## Quick start (local)

1. **Install dependencies**
   ```bash
   yarn install
   ```

2. **Backend: database and env**
   ```bash
   cd apps/hedone-be
   cp .env.example .env
   # Edit .env: set JWT_SECRET to at least 32 characters
   npx prisma generate
   npx prisma db push
   npx prisma db seed   # optional: creates sample artist (admin is created on first dev start)
   ```

3. **Run backend**
   ```bash
   yarn dev:be
   ```
   Backend runs at http://localhost:3001. Swagger at http://localhost:3001/docs. In development, an **admin user** is created automatically: **admin@carnawaze.local** / **admin** (use these to log in as admin).

4. **Run frontend** (in another terminal)
   ```bash
   yarn dev:fe
   ```
   Then press `w` for web, `a` for Android, or scan QR for Expo Go. Set `EXPO_PUBLIC_API_URL=http://localhost:3001` in `apps/hedone-fe/.env` if needed for web.

   **Expo/Metro terminal:** After "Android Bundled" (or similar), the terminal may show no new output. If keypresses (e.g. `r`, `j`, `a`, `w`) or **Ctrl+C** do nothing: (1) click inside the terminal so it has focus and try again; (2) if still unresponsive, **close the terminal tab/window** to stop the server, or open a **new terminal** in the project root and run **`yarn stop:fe`** to kill the process on port 8081 (or **`yarn stop:be`** for port 3001, **`yarn stop`** for both).

5. **Run everything together**
   ```bash
   yarn dev
   ```
   Starts backend and frontend concurrently.

## Testing

- **Backend unit tests**
  ```bash
  cd apps/hedone-be
  yarn test
  ```
- **Backend E2E (API)**
  ```bash
  cd apps/hedone-be
  yarn e2e
  ```
  E2E uses a separate SQLite DB (`e2e.sqlite`); global setup runs `prisma db push`.

- **Frontend unit tests**
  ```bash
  cd apps/hedone-fe
  yarn test
  ```
- **Frontend E2E (web, Playwright)**
  Start the frontend web app (`yarn dev:fe` then press `w`), then:
  ```bash
  cd apps/hedone-fe
  yarn e2e
  ```
  Or set `E2E_BASE_URL` if the app runs on another port.

## API (v1)

- **Auth:** `POST /v1/users`, `POST /v1/auth/login`, `POST /v1/auth/confirm-email`
- **User:** `GET /v1/users/me`, `PATCH /v1/users/me` (Bearer)
- **Artists:** `GET /v1/artists?q=` (search), `GET /v1/artists?page=&limit=` (admin list), `POST /v1/artists`, `DELETE /v1/artists/:id` (admin)
- **Pins:** `GET /v1/pins`, `POST /v1/pins`, `POST /v1/pins/report-incorrect`, `GET /v1/pins/:id/count` (Bearer)
- **Stats (admin):** `GET /v1/stats/users-count`, `GET /v1/stats/pins-by-minute`
- **Admin (hidden from Swagger):** `POST /v1/admin/users` — create admin user

## Seed data

- **Admin (local):** `admin@carnawaze.local` / `admin` — created automatically when you start the backend in development (`yarn dev:be`).
- **Artists:** one sample artist is created by seed

**Se a aba Artistas ou o botão Remover pin não aparecer para o admin:** no app, vá em **Perfil** e toque em **"Limpar cache e sair"**. Depois faça login de novo com **admin@carnawaze.local** / **admin**. Isso remove dados antigos de login e força o app a usar o usuário atualizado. No web: DevTools > Application > Local Storage > remova a chave `carnawaze-auth` e faça login novamente.

## Upgrading Expo and dependencies (hedone-fe)

From the project root or from `apps/hedone-fe`:

1. **Update Expo SDK and Expo-related packages (recommended)**  
   ```bash
   cd apps/hedone-fe
   npx expo install expo@latest
   npx expo install --fix
   ```  
   Or use the script: **`yarn upgrade:expo`** (from `apps/hedone-fe`).  
   This upgrades Expo and aligns all Expo packages (expo-router, expo-constants, react-native, etc.) to versions compatible with the new SDK.

2. **Check for issues**  
   ```bash
   npx expo-doctor
   ```

3. **Update other dependencies (optional)**  
   ```bash
   yarn upgrade-interactive --latest
   ```  
   Or: **`yarn upgrade:all`** to pick which packages to upgrade.

4. **Reinstall** (if you change major versions or see odd errors)  
   ```bash
   rm -rf node_modules
   yarn install
   ```

## Environment

- **hedone-be:** `DATABASE_URL`, `JWT_SECRET` (min 32 chars), `PORT`, `NODE_ENV`, `CORS_ORIGIN`
- **hedone-fe:** `EXPO_PUBLIC_API_URL` (e.g. `http://localhost:3001` for web)
