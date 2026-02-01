# Specification Driven Development (SDD) — Sketch

> **How to use this doc:** Fill in each section below. Use it as the single source of truth when prompting the AI to build Application 1 and Application 2. The AI will treat each section as a constraint and instruction set.
>
> **App scope:** Application 1 = **frontend**; Application 2 = **backend**. They communicate (frontend consumes the backend API).

---

## 1. Product & Scope

**What “Product & Scope” means (fill-in context):**

- **Product:** What the system is—names of the two apps, one-line purpose of each (what they do and for whom), and the context (e.g. mobile app for carnival trios in Salvador).
- **Scope:** Which app is frontend and which is backend, how they relate (who calls whom, same repo or not, same deployment or separate), and any high-level boundaries (e.g. “frontend only displays data and map; backend handles users, pins, and map data”).

**Fill in:**

- **Application 1 name:** `hedone-fe`
- **Application 2 name:** `hedone-be`
- **One-line purpose of each app:**  
  - App 1: `hedone-fe is the mobile-first frontend of the Carnawaze App. It displays data, the map, and map pins for the location of trios during Carnival in Salvador.`  
  - App 2: `hedone-be is the backend that powers the Carnawaze App: user registration, pins, and map data rendering for display in hedone-fe.`
- **Relationship between the apps:**  
  hedone-fe talks directly to hedone-be: one is the mobile frontend with all user interaction, the other handles data and services.

**Prompt-style instruction for the AI:**  
*When building, use (1) the app names for folders and references; (2) the purpose to check that features and endpoints match the product; (3) the relationship above for API, auth, and deployment decisions. Do not assume a different product or scope than described here.*

Product:
- The product has similar behavior as Waze: the users inform scenarios and situations through the path they are passing. In this case, we want the users to inform the location of the eletric trio in Carnival at Salvador. The user pin the eletric trio icon and inform the artist which are signing at this moment.
- The product need to maintain only one pin at time for each artist and eletric trio to maintin compatibility within the information provided by the users.
- The MVP is only to inform the location of the eletric trio in a map to be visualized by the user.
- The application must be prepare to be receive new pins to be used in the future if it growth faster.
- The user can register himself within your e-mail as the only information necessaary and its e-mail confirmation to apply the registration.
- The user visualize a map without satelite, just simple streets, like the Waze, and can pin the eletric trio informing the artist.
- The pin will maintin the same information for radius for 50m considering the eletric trio doesn't have a size bigger than that.
- How the pin works:
  - The eletric trios are closed, something like 50m.
  - When the trio move, new pins are informed by the users.
  - I need to detect the movement of the eletric trio.
  - I need to avoid several pins related to the same artist. To avoid this, the product must have the registration for all artists and the user doesn't write the artist, he/she search in our database.
  - The pin must represent the actual position by consent through the users.
  - The pin is an agrupation of information by users.
  - The center of this information became the position of the pin.
  - The distance x quantity will move the pin of the eletric trio, repositioning the trio.
  - If most of the information is in the same radius, the trio stopped moving.
  - Older information must lost confiability.
  - It must be a space-time ponderation.
- The product has two type of access:
  - User access:
    - The user can see your profile and the map to make the pins. The user can change to day/night view, and can manipulate the map to see others pins.
    - The user can confirm a pin instead create a new pin if the user wants.
    - The user can see the count of pins/confirmation or creation for the same artists.
  - Admin access:
    - It can register a new artist if necessary.
    - It can verify the quantity of users registered 
    - It shows the count of pins by minute for the users. 
    - The admin user is registrated by API and there isn't screen.
    - The endpoint is hidden from the swagger.yml and not exposed by anyone.
 
Scope:
- These two applications will be deployed together in same repository. The idea is to cheap the costs comunicating between them in localhost but applying for both of them internally these comunication in one server. 

---

## 2. Stack & Conventions

**Fill in:**

| Layer      | App 1 (frontend)          | App 2 (backend)           | Shared? (Y/N) |
|-----------|---------------------------|---------------------------|----------------|
| Frontend  | React Native (for web and mobile) |  |                |
| Backend   | —                         | TypeScript within the framework you want or without framework  |                |
| Database  | (e.g. PostgreSQL, Mongo)  | Choose the database more cheap to be used in the environment must easiest to be deployed and more cheap too, like Vercel, Hiraku etc. |                |
| Auth      | (e.g. JWT, OAuth, Auth0)  | Choose the Authentication more simple and secure to only register name, e-mail and password |                |
| API style | (REST / GraphQL / tRPC)   | Restfull |                |

- **Monorepo structure (if any):** e.g. `apps/app1`, `apps/app2`, `packages/shared`
- **Language/TS:** (e.g. TypeScript strict, Python 3.11+) Typescript in both
- **Package manager:** (e.g. pnpm, npm, yarn) yarn

**Prompt-style instruction for the AI:**  
*Use only the stack and versions specified here. Do not introduce new frameworks or languages unless a section below explicitly allows it. Prefer the stated API style for all client–server communication.*

- The App 1 is the a React Native Mobile frontend for the product.
- It must be mobile first but can be accessed through web.
- The frontend MVP has minimum screen as possible, including Registration Screen, Login Screen, Email Confirmation Screen, Map Screen (where is the center of the product and where the pins are used by users), Profile Screen, and Stats Screen within Artist Registration for the Admin User.
- The backend MVP it organize in a hexagonal architecture:
  - The usecases are by action (create, update, delete, get, list etc)
  - The controller handlers for each action are segregated by file too (create, update, delete, get, list etc)
  - The repository for each domain can be centralized
- The backend folders are segregated and modularized by domain and inside its domain has the controllers, usecases, gateways, repositories etc.


---

## 3. Domain & Entities

**Applies to both apps.** The domain is **shared**: App 2 (backend) **implements** it (API routes, DB schemas, use cases). App 1 (frontend) **uses** it by consuming the API—screens, forms, and UI flows are built around these same entities and actions (e.g. display Pins on the map, create/confirm Pin, list Artists). One domain model: backend owns persistence and API; frontend owns presentation and user actions that call the API.

**Fill in (shared domain):**

- **Core entities (nouns):**  
  - App 1 (frontend consumes): same entities—screens, components, and API calls map to these (e.g. User, Artist, Pin).  
  - App 2 (backend implements): same entities—API resources and DB tables.
- **Key actions (verbs) per entity:** e.g. User: create, login, updateProfile; Pin: create, confirm, list; Artist: list, create (admin).
  - User:
    - Can create account informing name and email.
    - Can confirm the email.
    - Can login in.
    - Can login out.
    - Can create pin. To create pin, it shows a dropdown to search for an already artist.
    - Can confirm pin.
    - Can inform the pin isn't correct.
    - Can visualize the map.
    - Can move by the map.
    - Can zoom in and zoom out the map.
    - Can acces your profile.
    - Can change the your profile's email. It must be confirm by the previously email.
    - Can change your name.
    - Can visualize the count of pins for any pin through by the users.
  - Admin:
    - Can do everything the user can do and:
      - Your profile has artist registration.
      - Can delete a registered artist.
      - Can list the artists.
- **Relationships:** e.g. User has many Pins; Pin belongs to Artist; Pin has location (lat/lng).
    - Pin has location lat/lng.
    - Pin has a weighted average by the pins locations from the newest to the older.
    - This weighted average will move the pin if necessary or conclude if the pin is still.
    - The pin must be removed after 1h without pin.
    - User can pin and it irrelevant if he is the owner of the pin.
    - The artist must be applied to one pin only. If the artist hasn't pin, create the pin within the artist.
    - If the pin is removed after 1h, delete the pin and "free" the artist from this pin.

**Prompt-style instruction for the AI:**  
*All API routes and DB schemas (App 2) and all UI flows, screens, and API calls (App 1) must align with these entities and actions. Do not add major new entities without a dedicated “New entity” subsection here.*

---

## 4. API Contract (Backend)

**Fill in or attach:**

- **Base URL pattern:** e.g. `/v1/{domain}`
- **Auth header:** e.g. `Authorization: Bearer <token>`
- **Endpoints (list or link to OpenAPI/Swagger):**

  | Method | Path              | Purpose        | Request body (key fields)     | Response (key fields) |
  |--------|-------------------|----------------|-------------------------------|------------------------|
  | GET    | `/users`          | List users     | —                             | `{ users: [], total }` |
  | POST   | `/users`          | Create user    | `email, name, password`       | `{ user, token }`      |
  | …      | …                 | …              | …                             | …                      |

- **Error format:** e.g. `{ "status": "BAD_REQUEST", "code": "VALIDATION_ERROR", "message": "...", "details": [] }`
- **Pagination:** e.g. `?page=1&limit=100` and response `{ items, page, totalPages }`. It applies only for artists for the admin. In the User case, when he/she pins, it necessary make a search based the input of the user, something "I" return Ivete Sangalo or Ivan Novaes and goes on.

**Prompt-style instruction for the AI:**  
*Implement backend routes to match this table exactly. Implement frontend API clients to use these paths, methods, and shapes. All errors must follow the stated format.*

---

## 5. Data Model & Persistence (Backend)

**Fill in:**

- **Database type and version:** e.g. PostgreSQL 15
- **Schema summary (tables/collections and key columns):**

  - `users`: id, email, name, password_hash, created_at, updated_at  
  - `sessions`: id, user_id, token, expires_at  
  - …

- **Migrations strategy:** (e.g. Flyway, Alembic, Prisma migrate, manual SQL files)
- **Seeds (if any):** e.g. dev admin user, sample data for App 1 / App 2

**Prompt-style instruction for the AI:**  
*Create or update migrations to match this schema. Do not add columns/tables that are not listed here or explicitly requested in a later “Change request” section.*

---

## 6. Frontend Structure (App 1) & UX Rules

**Applies only to App 1 (frontend).** App 2 (backend) has no UI screens or routing.

**Fill in:**

- **App 1 (frontend):**
  - **Pages/screens (list):** e.g. Home, Login, Dashboard, Settings
  - **Routing:** (e.g. file-based, or explicit route list)
  - **Global state:** (e.g. React Query + Zustand, Redux, Pinia)
  - **Form/validation:** (e.g. Zod + React Hook Form, VeeValidate)

- **UI rules:**
  - **Design system or lib:** (e.g. Tailwind, MUI, custom tokens)
  - **Accessibility:** (e.g. WCAG 2.1 AA, minimum keyboard nav + labels)
  - **i18n:** (none / single locale / which lib and locale codes)

**Prompt-style instruction for the AI:**  
*Use this section only for the frontend (App 1). Create only the pages and routes listed. Use the chosen state and form stack. Apply the design system and a11y rules stated above.*

---

## 7. Security & Environment

**Fill in:**

- **Secrets:** (e.g. env vars only; no secrets in repo; list names: `DATABASE_URL`, `JWT_SECRET`, …)
- **CORS:** (e.g. allowed origins for App 1 and App 2)
- **Rate limiting:** (e.g. 100 req/min per IP for auth routes)
- **Input validation:** (e.g. validate all request bodies with Zod/Joi against the API contract)

**Prompt-style instruction for the AI:**  
*Use only the env var names listed. Apply the stated CORS and rate limits. Validate every API input against the contract before DB or business logic.*

---

## 8. Testing Expectations

**Fill in:**

- **Backend:** (e.g. unit for services, integration for API routes; which runner: Jest, Vitest, pytest)
- **Frontend:** (e.g. Vitest + React Testing Library; E2E: Playwright/Cypress, yes/no)
- **Coverage target (optional):** e.g. >80% for services and API handlers

**Prompt-style instruction for the AI:**  
*Add tests that match this strategy. Prefer tests that assert against the API contract and domain entities defined above.*

---

## 9. Deployment & Repo

**Fill in:**

- **Repo layout:** (e.g. single repo, two folders; or two repos with shared package)
- **Build commands:** e.g. `pnpm build:app1`, `pnpm build:app2`, `pnpm build:backend`
- **Run locally:** e.g. `pnpm dev` (all), or `pnpm dev:app1`, `pnpm dev:backend`
- **Deploy target (optional):** e.g. Vercel (frontend) + Railway (backend), or Docker Compose

**Prompt-style instruction for the AI:**  
*Keep scripts and folder structure aligned with this layout. Do not add new top-level apps or services without a “Scope change” note below.*

---

## 10. Change Log & Overrides

**Use this section to:**

- Add one-off changes (e.g. “Add endpoint GET /reports/summary”).
- Override a previous spec (e.g. “Use GraphQL for App 2 only”).
- Clarify ambiguous points.

**Format:**  
`[Date or version] — Description. Section to update: X.Y.`

**Prompt-style instruction for the AI:**  
*Process entries here in order. They override or extend the sections above. If an entry conflicts with the table or schema, the Change Log wins for that specific point.*

---

## Quick Reference for AI (Do Not Edit)

When generating code for **Application 1** or **Application 2**:

1. **Read** sections 1–2 first (scope + stack).
2. **Resolve entities and API** from sections 3–4.
3. **Backend work:** follow sections 4, 5, 7, 8.
4. **Frontend work:** follow sections 4, 6, 8.
5. **Apply** section 10 overrides last.
6. **Do not** invent new entities, endpoints, or pages unless section 10 or a user message explicitly requests it.
7. **Keep** file names, folder structure, and scripts consistent with section 9.
