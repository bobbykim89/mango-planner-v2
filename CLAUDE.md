# Mango Planner v2

Full-stack todo/planner app: Nuxt 4 (Vue 3) frontend + Nitro/H3 API in one repo, MongoDB via Mongoose. Features: plan CRUD with drag-to-reorder, Markdown + KaTeX in plan content, user profile with Cloudinary-hosted picture, JWT auth with email password reset, dark/light mode, OpenWeather widget, offline draft recovery (IndexedDB via localforage), installable PWA. Deployed on Vercel (https://mango-planner.vercel.app/).

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
| `pnpm typecheck` | `vue-tsc --noEmit` |

There are **no tests and no linter yet**. Vitest is planned and will become a required PR check. Until then, verify changes with `pnpm typecheck` and `pnpm build`, and exercise the affected flow in `pnpm dev`.

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
- **Client state:** Pinia setup stores in `app/stores/`, initialized once by `app/plugins/init.plugin.ts` → `initPiniaStore.initStores()`. Store actions call `$fetch` directly and route failures through a local `handleError`. Guard browser-only APIs (localforage, geolocation, window) with `import.meta.client` to avoid SSR/hydration errors.
- **Markdown:** rendered with `marked` + `marked-katex-extension` and sanitized with DOMPurify (`useMarkdown`). Never render user content with `v-html` unsanitized.
- **Config/secrets:** all secrets come from `runtimeConfig` in `nuxt.config.ts` (server-only keys). Never expose them via `runtimeConfig.public` or return them from API routes.
- **PWA:** `@vite-pwa/nuxt` with `strategies: 'generateSW'`, `registerType: 'autoUpdate'`. `/api/*` is excluded from navigation fallback. Disabled in dev.
- **Style:** Prettier (single quotes, no semicolons, 2-space indent). TypeScript strict. Match the surrounding code.

## Guardrails

- Do **not** read, print, or edit `.env` / `.env.*`. If you need to know which variables exist, look at `runtimeConfig` in `nuxt.config.ts`.
- `pnpm dev:prod` and `build` without `:local` point at production services. Don't run anything that writes data against them without asking.
- `master` is protected: work on a branch and open a PR. Commit messages follow Conventional Commits with a scope, e.g. `fix(server/controller): ...`, `refactor(app/stores): ...`.
