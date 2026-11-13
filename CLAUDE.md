# Mango Planner v2

Full-stack todo/planner app: Nuxt 4 (Vue 3) frontend + Nitro/H3 API in one repo, MongoDB via Mongoose. Features: plan CRUD with drag-to-reorder, Markdown + KaTeX in plan content, user profile with Cloudinary-hosted picture, JWT auth with email password reset, dark/light mode, OpenWeather widget, offline draft recovery (IndexedDB via localforage), installable PWA. Deployed on Vercel (https://mango-planner.bobbykim.dev/).

Current focus: hardening **security**, improving **performance**, and fixing intermittent runtime errors. Prefer small, verifiable changes over sweeping rewrites.

## Toolchain

- Node **24** (`.nvmrc`; run `nvm use` first). `engines.node` is `>=24.0.0`.
- pnpm **12** pinned via `packageManager` (use corepack). Build scripts must be explicitly allowed in `pnpm-workspace.yaml` under `allowBuilds`; pnpm 12 fails the install on unapproved ones.

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install deps (runs `nuxt prepare` to generate `.nuxt/` types) |
| `pnpm dev` | Dev server on :3000 using `.env.local` |
| `pnpm dev:prod` | Dev server using `.env` (production credentials, so use with care) |
| `pnpm build` / `pnpm build:local` | Production build (`build:local` loads `.env.local`) |
| `pnpm preview` | Serve the production build |
| `pnpm typecheck` | `nuxt typecheck` (vue-tsc across the app/server/shared project references) |
| `pnpm test` | All Vitest tests: the `api` project (builds the app, runs it against an in-memory MongoDB) and the `unit` project |
| `pnpm vitest run --project unit` | Only the fast client unit tests (no build) |
| `pnpm test:watch` | Vitest in watch mode |

**Tests:** Vitest runs two projects (`vitest.config.ts`):

- `api`: `test/api/` and `test/pages/`. The global setup (`test/setup/global.ts`) builds the app with the fake values in `test/test.env` (never the real `.env`), starts it against `mongodb-memory-server` with require-of-ESM disabled (like Vercel), and the tests call the real `/api` routes and render real pages. Set `SKIP_BUILD=1` to reuse an existing `.output` when only tests changed.
- `unit`: `test/unit/`, client stores and composables in the Nuxt environment (happy-dom). Mock API routes with `mockApi`/`ok`/`fail` from `test/unit/helpers.ts` (wraps `registerEndpoint`), call `resetState()` in `beforeEach` and `clearApiMocks()` in `afterEach`, mock `navigateTo` per file with `mockNuxtImport`, and mock localforage with `memoryLocalforage()` (no IndexedDB in happy-dom). CI (`.github/workflows/ci.yml`) runs `pnpm typecheck` and `pnpm test` on every PR. There is no linter yet; also exercise UI changes in `pnpm dev`.

## Layout

```
app/        Nuxt app (srcDir): pages, components/{layout,plans,widget}, stores (Pinia), composables, middleware, plugins
server/     Nitro: api/ (file-based routes), controller/ (business logic), utils/ (auto-imported), plugins/connectDb.ts
shared/     Code used by both sides (#shared alias): models/ (Mongoose), dto/ (Zod schemas), types/
public/     PWA icons, screenshots, weather icons
```

## Conventions

- **API routes are thin.** Each `server/api/**/<name>.<method>.ts` only wires middleware and a controller method:
  ```ts
  export default defineEventHandler({
    onRequest: [defineRequestMiddleware(checkAuth)],
    handler: eventHandler(planController.updatePlan),
  })
  ```
  Logic lives in class-based controllers (`server/controller/<domain>/<domain>.controller.ts`), exported as singletons from `server/controller/index.ts`.
- **Validation:** request bodies go through Zod schemas in `shared/dto/<domain>/` via `readValidatedBody(e, schema.parse)`.
- **Errors:** throw `createError({ status, message, statusMessage })`. The client surfaces `statusMessage` to users (`useErrorCheck().extractErrorMessage`) and treats `statusCode === 401` as "log out and redirect to /auth/login".
- **Auth:** `POST /api/auth` returns `access_token: "Bearer <jwt>"`. The client stores it in the `access_token` cookie (`useAuthToken`, 7 days) and sends it verbatim as the `Authorization` header. `server/utils/checkAuth.util.ts` verifies it and sets `event.context.user`. Ownership checks (`plan.author.toString() !== user.id`) live in each controller method.
- **Client state:** Pinia setup stores in `app/stores/`, initialized once by `app/plugins/init.plugin.ts` → `useSessionStore().init()` (on the server from the request cookie; the client reuses the hydrated state).
  - Store actions wrap their body in the runner from `useStoreAction()` (session-cookie guard, success/error alerts, expired session → `sessionStore.expire()`), call the API through `useApi()`, and update state from the API response instead of refetching. Actions never throw; they resolve `true`/`false`.
  - `userStore`, `profileStore` and `planStore` don't import each other; only `sessionStore` (startup, logout, expiry) combines them. Logic that needs two stores goes in a composable (e.g. `usePlansByOrder`) or the page.
  - Offline drafts persist through `useDrafts()` (IndexedDB via localforage); `planStore.drafts` is the reactive list.
  - Guard browser-only APIs (localforage, geolocation, window) with `import.meta.client` to avoid SSR/hydration errors.
- **Markdown:** rendered with `marked` + `marked-katex-extension` and sanitized with DOMPurify (`useMarkdown`). Never render user content with `v-html` unsanitized.
- **Config/secrets:** all secrets come from `runtimeConfig` in `nuxt.config.ts` (server-only keys). Never expose them via `runtimeConfig.public` or return them from API routes.
- **PWA:** `@vite-pwa/nuxt` with `strategies: 'generateSW'`, `registerType: 'autoUpdate'`. `/api/*` is excluded from navigation fallback. Disabled in dev.
- **Style:** Prettier (single quotes, no semicolons, 2-space indent). TypeScript strict. Match the surrounding code.

## Guardrails

- Do **not** read, print, or edit `.env` / `.env.*`. If you need to know which variables exist, look at `runtimeConfig` in `nuxt.config.ts`.
- `pnpm dev:prod` and `build` without `:local` point at production services. Don't run anything that writes data against them without asking.
- `master` is protected: work on a branch and open a PR. Commit messages follow Conventional Commits with a scope, e.g. `fix(server/controller): ...`, `refactor(app/stores): ...`.
