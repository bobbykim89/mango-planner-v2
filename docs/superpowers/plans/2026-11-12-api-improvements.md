# API Improvements (#19) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every `/api` route returns the `{ ok, data }` / `{ ok: false, error: { code, message, fields? } }` envelope. The listed security holes are closed. Controllers share their lookups through a base class. The client keeps working through one fetch wrapper.

**Architecture:**

- A `defineApiHandler` wrapper owns the envelope, auth, rate limiting and error mapping, so routes stay one-liners.
- `ApiError` plus a shared code catalog drive every failure.
- A `BaseController` holds the common lookups.
- Routes are migrated one domain at a time, each together with its client call sites.
- The client wrapper accepts both the old and new shapes until the last domain is migrated, so the app works after every task.

**Tech Stack:** Nuxt 4.6 (Nitro 2 / h3), Mongoose 9, Zod 4, jsonwebtoken, bcryptjs, Cloudinary, nodemailer. Client: Pinia setup stores, `$fetch` (ofetch). Tests: Vitest with `mongodb-memory-server`, against a built Nitro server. CI: GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-12-api-improvements-design.md`. Read it first. It holds the decisions, the error catalog, the limits and the wording rules. This plan only says how to carry them out.

## Global Constraints

- **Envelope (user's decision):**
  - Success: `{ "ok": true, "data": <payload> }`.
  - Failure: `{ "ok": false, "error": { "code", "message", "fields"? } }`.
  - `fields` is `[{ field, message }]`, present only for `VALIDATION_FAILED`.
- **No extra top-level keys** in either shape.
- **HTTP status agrees with `ok`:** 400, 401, 403, 404, 409, 413, 415, 429, 502, 500, as in the spec.
- **Ownership failures** return `403 FORBIDDEN`, never 401.
- **401 is only for** `AUTH_TOKEN_MISSING`, `AUTH_TOKEN_INVALID` and `AUTH_INVALID_CREDENTIALS`.
- **Error messages:** plain user-facing sentences, with no "Bad Request:" prefixes, internals or stack traces. Server-side details go to `console.error` only.
- **Keep class-based controllers,** exported as singletons from `server/controller/index.ts`. Routes stay one-liners.
- **Limits:**
  - plan title: trimmed, 1–200 characters
  - plan content: at most 10,000 characters
  - plan type: one of `personal`, `work` or `chore`
  - username: trimmed, 1–50 characters
  - email: trimmed, lowercased and valid
  - `plansOrder`: at most 1,000 entries, each a valid ObjectId
  - upload: at most 5 MB, JPEG or PNG judged by the file's first bytes
  - password special character: anything that isn't a letter or digit
- **Rate limits:**

  | Route          | Limit                                      |
  | -------------- | ------------------------------------------ |
  | Login          | 10 per 15 minutes per IP                   |
  | Signup         | 5 per hour per IP                          |
  | Send-token     | 5 per hour per IP and 3 per hour per email |
  | Reset-password | 10 per hour per IP                         |

  Over the limit returns `429 RATE_LIMITED` with a `Retry-After` header (seconds).

- **Reset links:** `runtimeConfig.appUrl`, defaulting to `https://mango-planner.bobbykim.dev`. Development uses the request origin. The client never sends `url`.
- **Reset tokens:** `crypto.randomBytes(32).toString('hex')`. Store only its SHA-256 hash. Single use, with a 1-hour TTL.
- **JWT:** sign and verify with `HS256` explicitly, with a 7-day lifetime.
- **No index or data migrations.** Email lookup follows the spec's exact → lowercase → case-insensitive-if-unique order.
- **Project rules:**
  - Never read `.env*`.
  - CLAUDE.md conventions apply: Prettier with `--single-quote --no-semi` and strict TS.
  - Work on branch `feat/api-improvements` as one PR that closes #19.
  - Commits use scopes such as `refactor(server)` or `fix(server/controller)`, end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, and are only made as the plan's commit steps say.
- **Tests:**
  - API tests are committed Vitest files under `test/api/`.
  - They run against a production build of the app, backed by a throwaway in-memory MongoDB (`mongodb-memory-server`). They never touch the dev or production database and need no real secrets.
  - Each test file creates its own users with unique emails through the test helpers.
  - Email, Cloudinary and OpenWeather are never called by tests:
    - email uses the log transport
    - uploads are rejected before reaching Cloudinary
    - only weather's validation and auth paths are tested
  - Only the throwaway UI smoke script in Task 8 uses the dev server and the `claude-test+mcl@example.com` account. Its password comes from the person running the work, as `API_EMAIL` / `API_PASSWORD`, and must never be committed.

## Review Focus

1. **A user whose stored email has capitals** (from before this change) logs in typing any capitalisation, or the exact original. If two accounts differ only by case, each still logs in with its exact email. (Task 2, cases `login-mixed-case` and `login-exact-legacy`.)
2. **The app works between tasks:** after each domain migration, every flow still works, because the client wrapper accepts both shapes. (Each task's step "app smoke for this domain"; Task 8 removes the old-shape path.)
3. **SSR calls:** the stores call the API on the server since #18. The wrapper must work during SSR, forwarding the cookie's token, and a server-side API failure must not crash page rendering. (Task 1, case `ssr-wrapper`; Task 8 smoke `returning-user`.)
4. **A request body that isn't JSON** (wrong content type, or malformed JSON) returns `400 BAD_REQUEST` in the envelope, not a 500 or an HTML error page. (Task 1, case `malformed-json`.)
5. **A reset link used twice, or after a newer one was requested,** fails with `RESET_TOKEN_INVALID` and doesn't change the password. (Task 5, cases `token-single-use` and `token-replaced`.)

---

## Test harness (built in Task 0, used by every task)

- **Run:** `pnpm test` runs everything, and `pnpm test test/api/<name>.test.ts` runs one file.
- **Build reuse:** by default the global setup builds the app once per run. Set `SKIP_BUILD=1` to reuse an existing `.output` when only test files changed.
- **`test/setup/global.ts` (Vitest `globalSetup`):**
  1. Starts `MongoMemoryServer`.
  2. Unless `SKIP_BUILD=1`, runs `nuxi build --dotenv test/test.env`. That committed file holds fake, non-secret values, so the developer's `.env` is never loaded.
  3. Spawns `node .output/server/index.mjs` on a free port. The environment sets `NUXT_MONGO_URI` (memory server), `NUXT_JWT_SECRET=test-secret`, `NUXT_APP_URL=https://app.test` and `NUXT_MAILER_TRANSPORT=log`. The other secrets get fake values.
  4. Pipes the server's stdout and stderr to `test/.tmp/server.log`, which is gitignored.
  5. Polls `GET /api/does-not-exist` until it responds.
  6. Calls `provide('baseUrl')`, `provide('mongoUri')` and `provide('serverLog')`.
  7. Teardown kills the server and stops the memory server.
- **`test/utils/api.ts`** exports:
  - `api(method, path, { body?, token?, headers?, raw? }) -> Promise<{ status: number; json: any; headers: Headers }>`
    - Sends JSON, unless `raw` is a string or `FormData`.
    - Sends a unique `x-forwarded-for` on every call by default, so rate limits never collide. Pass an explicit header to share a key.
  - `createUser(overrides?) -> Promise<{ id: string; email: string; password: string; token: string }>`: signs up a unique `user-<n>@test.local` through the API.
  - `login(email, password) -> Promise<string>`
  - `expectOk(res, status = 200)` and `expectError(res, status, code)`: Vitest assertions on the status and the exact key sets (`ok` and `data`, or `ok` and `error`, plus `code`, `message` and optionally `fields` inside `error`).
  - `fieldsOf(res) -> Record<string, string>`
  - `readMail(to: string) -> Promise<string[]>`: reads `serverLog` and returns the texts of `[mail] to=<to>` lines in order.
- **`test/utils/db.ts`** exports:
  - `db() -> Promise<typeof mongoose>`, connected to `mongoUri`
  - `insertLegacyUser({ email, password }) -> Promise<{ id }>`: inserts a user directly, with the email unnormalized and a bcrypt hash, to test pre-existing accounts
- **Helpers stay small:** no snapshot tests, and no mocks of the app's own code.

---

### Task 0: Vitest setup and CI

**Files:**

- Create:
  - `vitest.config.ts`
  - `test/setup/global.ts`
  - `test/utils/api.ts`
  - `test/utils/db.ts`
  - `test/test.env`
  - `test/api/smoke.test.ts`
  - `.github/workflows/ci.yml`
- Modify:
  - `package.json`: dev dependencies `vitest`, `mongodb-memory-server` and `get-port-please` (already a Nuxt dependency; use it directly), plus scripts `"test": "vitest run"` and `"test:watch": "vitest"`
  - `pnpm-workspace.yaml`: `allowBuilds` for `mongodb-memory-server`'s postinstall, and the `minimumReleaseAge` excludes if pnpm rejects a version
  - `.gitignore`: `test/.tmp/`
  - `CLAUDE.md`: add `pnpm test` / `pnpm test:watch` to the Commands table, and replace "There are no tests and no linter yet…" with a short note. It covers where the API tests live, that they use an in-memory MongoDB (`SKIP_BUILD=1` reuses `.output`), that CI runs typecheck and the tests on PRs, and that there is still no linter.
  - `nuxt.config.ts`: runtime config `mongoUri: process.env.MONGO_URI || ''`, `appUrl: process.env.APP_URL || 'https://mango-planner.bobbykim.dev'` and `mailerTransport: process.env.MAILER_TRANSPORT || 'smtp'`, all server-only
  - `server/plugins/connectDb.ts`: use `mongoUri` when it is set, otherwise the existing Atlas URL. Never `process.exit`.

**Interfaces (Produces):**

- The harness section above.
- **`vitest.config.ts`:**
  - `test.include: ['test/**/*.test.ts']`
  - `globalSetup: ['test/setup/global.ts']`
  - `fileParallelism: false`
  - `testTimeout: 30_000`
  - `hookTimeout: 300_000`
- **CI (`ci.yml`):** on `pull_request` and on `push` to `master`:
  1. checkout
  2. `actions/setup-node` with `node-version-file: .nvmrc`
  3. `corepack enable`
  4. `pnpm install --frozen-lockfile`
  5. `pnpm typecheck`
  6. `pnpm test`

  The job is named `test`, which is the name that will later become the required check.

- [ ] **Step 1: Write `test/api/smoke.test.ts`.**
  - `it('serves the API')`: `GET /api/does-not-exist` returns a JSON response. Today that is Nuxt's error JSON with status 404. Assert `status === 404` only.
  - `it('connects to the memory database')`: `db()` lists collections without throwing.

- [ ] **Step 2: Install, then run `pnpm test`. Expected FAIL** before the setup files exist, with "Cannot find module" or similar. Then add the files.

- [ ] **Step 3: Implement** the config, the global setup, the helpers, the `nuxt.config.ts` keys and `connectDb`.

- [ ] **Step 4: Run `pnpm test` → PASS.** Then run `pnpm typecheck` → OK, and `pnpm dev` still starts against `.env.local`: `mongoUri` is empty there, so the Atlas URL is used.

- [ ] **Step 5: Commit.**
  - Message: `test: add Vitest API test harness with in-memory MongoDB and CI workflow`
  - Include `docs/superpowers/specs/2026-11-12-api-improvements-design.md` and `docs/superpowers/plans/2026-11-12-api-improvements.md` in this first commit.

---

### Task 1: Envelope infrastructure, base controller, client wrapper

**Files:**

- Create:
  - `shared/types/api.types.ts`, exported from `shared/types/index.ts`
  - `server/utils/apiError.ts`
  - `server/utils/defineApiHandler.ts`
  - `server/utils/authToken.ts`
  - `server/controller/base.controller.ts`
  - `server/api/[...].ts`
  - `app/composables/useApi.ts`
  - `app/utils/apiClientError.ts`
- Modify:
  - `server/utils/checkAuth.util.ts`: replace it with `requireAuth` inside `authToken.ts` and delete the file once nothing imports it (Task 6 removes the last user)
  - `server/plugins/connectDb.ts`: no `process.exit`
  - `app/composables/useErrorCheck.ts`
- Test: `test/api/core.test.ts`

**Interfaces (Produces):**

- **`shared/types/api.types.ts`:**
  - `ApiErrorCode`: a string union with exactly the spec's catalog.
  - `ApiFieldError = { field: string; message: string }`
  - `ApiSuccess<T> = { ok: true; data: T }`
  - `ApiFailure = { ok: false; error: { code: ApiErrorCode; message: string; fields?: ApiFieldError[] } }`
  - `ApiResponse<T> = ApiSuccess<T> | ApiFailure`
- **`server/utils/apiError.ts`:**
  - `class ApiError extends Error { status: number; code: ApiErrorCode; fields?: ApiFieldError[] }` with constructor `(status, code, message, fields?)`.
  - `apiError: Record<…, (message?: string, fields?) => ApiError>`, holding one factory per code, each with its default status and default message.
  - Default messages, in the spec's tone:
    - `AUTH_TOKEN_MISSING`: "Please sign in to continue."
    - `AUTH_TOKEN_INVALID`: "Your session has expired. Please sign in again."
    - `AUTH_INVALID_CREDENTIALS`: "That email or password isn't right."
    - `FORBIDDEN`: "You don't have access to this item."
    - `NOT_FOUND`: "We couldn't find what you were looking for."
    - `INVALID_ID`: "That link or ID isn't valid."
    - `VALIDATION_FAILED`: "Some fields need your attention."
    - `RATE_LIMITED`: "Too many attempts. Please wait a few minutes and try again."
    - `INTERNAL_ERROR`: "Something went wrong on our side. Please try again."
    - The other codes get similar one-sentence messages.
  - `toApiFailure(err: unknown): { status: number; body: ApiFailure; headers?: Record<string, string> }`. Mapping:
    - `ApiError` → itself.
    - `ZodError` → `VALIDATION_FAILED` with fields from `issue.path.join('.')` and `issue.message`. The first issue per field wins.
    - An h3 error with status 400 from body parsing → `BAD_REQUEST`.
    - A Mongoose `CastError` → `INVALID_ID`.
    - Anything else → `INTERNAL_ERROR`, after `console.error` of the original.
- **`server/utils/defineApiHandler.ts`:** `defineApiHandler<T>({ auth?: boolean; rateLimit?: RateLimitName | RateLimitName[]; handler: (e: H3Event) => Promise<T> | T })`. It returns an h3 event handler that:
  1. applies the rate limit (a no-op until Task 7 adds `server/utils/rateLimit.ts`; declare `type RateLimitName = string` here for now)
  2. calls `await requireAuth(e)` when `auth` is set
  3. returns `ok(await handler(e))`, where `ok` is `{ ok: true, data: value ?? null }`
  4. on any throw, uses `setResponseStatus` and the headers from `toApiFailure` and returns its body (it never rethrows)
- **`server/utils/authToken.ts`:**
  - `signToken(id: string): string` (HS256, 7 days)
  - `requireAuth(e: H3Event): void`
    - Reads `Authorization`, strips `Bearer `, and calls `jwt.verify(token, secret, { algorithms: ['HS256'] })`.
    - Sets `e.context.user = { id }`.
    - Throws `apiError.AUTH_TOKEN_MISSING()` or `apiError.AUTH_TOKEN_INVALID()`.
  - `hashPassword(pw: string): Promise<string>` (bcrypt, salt 10)
- **`server/controller/base.controller.ts`:** `abstract class BaseController` with protected:
  - `validateBody<S extends ZodType>(e, schema: S): Promise<z.infer<S>>`: `readBody` then `schema.parse`. Zod errors propagate to the wrapper's mapping, and a body read failure → `BAD_REQUEST`.
  - `requireObjectId(id: unknown): string`: else throws `INVALID_ID`.
  - `requireUser(e): Promise<UserDocument>`: `findById(e.context.user.id).select('-password')`, else `USER_NOT_FOUND`.
  - `requireProfile(userId: string): Promise<ProfileDocument>`, else `PROFILE_NOT_FOUND`.
  - `findOwnedPlan(planId: unknown, userId: string): Promise<PlanDocument>`: does `requireObjectId`, then `PLAN_NOT_FOUND`, then `FORBIDDEN`.
- **`server/api/[...].ts`:** `defineApiHandler({ handler: () => { throw apiError.NOT_FOUND() } })`
- **`app/utils/apiClientError.ts`:** `class ApiClientError extends Error { status: number; code: ApiErrorCode | 'NETWORK_ERROR' | 'UNKNOWN'; fields: ApiFieldError[] }`, plus `fieldMap(err: unknown): Record<string, string>`.
- **`app/composables/useApi.ts`:** `useApi()` returns `<T>(url: string, opts?: { method?; body?; query? }) => Promise<T>`.
  - Adds `Authorization` from `useAuthToken()` when it is set.
  - Transition rule: if the body has `ok === true`, return `.data`; otherwise return the body unchanged (old shape).
  - On a `FetchError`:
    - if `err.data?.ok === false`, throw an `ApiClientError` from `err.data.error`
    - else, if it is an old-shape error, throw an `ApiClientError` with `statusMessage` as the message
    - no response → `NETWORK_ERROR`, "Can't reach the server. Check your connection and try again."
- **`useErrorCheck`:**
  - `extractErrorMessage` prefers `ApiClientError.message`.
  - `isAuthError(err)` is true for `ApiClientError` codes `AUTH_TOKEN_MISSING` or `AUTH_TOKEN_INVALID`, and for old-shape 401s until Task 8.

- [ ] **Step 1: Write `test/api/core.test.ts`.** Cases:
  - `unknown-route`: `GET /api/does-not-exist` → `expectError(res, 404, 'NOT_FOUND')`, with message `"We couldn't find what you were looking for."`.
  - `malformed-json`: added in Task 3 once the plan routes are migrated. Don't write it here.
  - `ssr-wrapper`: `createUser()`, then `GET /` with `cookie: access_token=<encodeURIComponent(token)>`. Expect 200, with HTML containing the user's name, which proves the store fetched through the wrapper during SSR.
  - `old-shape-still-works`: `GET /api/plan` with the token still returns an array (old shape), proving the transition path. Task 3 deletes this case.

- [ ] **Step 2: Run it. Expected:** `unknown-route` fails (today's Nuxt 404 JSON isn't the envelope), and `ssr-wrapper` and `old-shape-still-works` pass.

- [ ] **Step 3: Implement the files in the Interfaces block.**
  - Replace `checkAuth` imports with `requireAuth` only where a route is migrated. Unmigrated routes keep `checkAuth` until their task.
  - `connectDb`: log the error and return. No `process.exit`.

- [ ] **Step 4: Switch the stores and components to `useApi()`.**
  - Covers all 19 call sites: `userStore`, `planStore`, `profileStore`, `WeatherWidget.vue`, `auth/request.vue` and `auth/reset-password.vue`.
  - Behaviour must be unchanged at this point, which the transition rule guarantees.
  - Remove the hand-built `Authorization` headers; the wrapper adds them.

- [ ] **Step 5: Verify.**
  - Run `pnpm test test/api/core.test.ts` → PASS.
  - Run `pnpm typecheck` → OK.
  - App smoke: log in through the UI, create and delete a plan, and toggle dark mode.

- [ ] **Step 6: Commit.**
  - Message: `refactor(server): add API envelope, error catalog and shared controller base`
  - Body mentions the client `useApi` wrapper.

---

### Task 2: Auth and user routes (login, current user, signup, username, password)

**Files:**

- Modify:
  - `server/api/auth/index.get.ts`
  - `server/api/auth/index.post.ts`
  - `server/api/user/index.post.ts`
  - `server/api/user/password/index.put.ts`
  - `server/api/user/username/index.put.ts`
  - `server/controller/auth/auth.controller.ts`
  - `server/controller/user/user.controller.ts`
  - `shared/dto/auth/authInput.dto.ts`
  - `shared/dto/user/*.ts`
  - `app/stores/userStore.ts`
  - `app/pages/auth/signup.vue`
  - `app/pages/auth/reset-password.vue` (password rule import only)
- Test: `test/api/auth.test.ts`

**Interfaces:**

- **Consumes:** Task 1's `defineApiHandler`, `BaseController`, `apiError`, `signToken`, `hashPassword` and `useApi`.
- **Produces:**
  - **`shared/dto/user/userInput.dto.ts`:**
    - `PASSWORD_SPECIAL = /[^A-Za-z0-9]/`
    - `passwordRules: { test: RegExp; message: string }[]`: length 8+, an uppercase letter, a lowercase letter, a number, and `PASSWORD_SPECIAL`
    - `passwordSchema`, built from `passwordRules`
    - `emailSchema = z.string().trim().toLowerCase().pipe(z.email('Please enter a valid email address.'))`
    - `usernameSchema`: `username`, trimmed, 1–50 characters
  - **`UserController` (extends `BaseController`):** `findUserByEmail(email: string): Promise<UserDocument | null>`, public because Task 5 reuses it. It implements the spec's lookup order:
    1. exact (trimmed) match
    2. lowercase match
    3. collation `{ locale: 'en', strength: 2 }`, where `find().limit(2)` must return exactly one user
  - **`userStore`:** `fieldErrors: Ref<Record<string, string>>`. It is set from `fieldMap(err)` on `VALIDATION_FAILED` and cleared at the start of every action.
  - **Response data:**
    - login and signup: `{ accessToken: string }`
    - `GET /api/auth`: the user without the password
    - username update: the user without the password
    - password update: `null`

- [ ] **Step 1: Write `test/api/auth.test.ts`.** Cases:
  - `login-ok`: `POST /api/auth` with valid credentials → `expectEnvelopeOk` and `data.accessToken` starts with `'Bearer '`.
  - `login-wrong-password` → `401 AUTH_INVALID_CREDENTIALS`, message "That email or password isn't right."
  - `login-unknown-email` → `401 AUTH_INVALID_CREDENTIALS`, with the same message. The response must not reveal whether the email exists.
  - `login-mixed-case`: a user created as `mixed-<n>@test.local` logs in as `MIXED-<n>@TEST.LOCAL`. Assert the stored email is lowercase via `db()`.
  - `login-exact-legacy`: `insertLegacyUser({ email: 'Legacy.User@Test.Local' })`. Logging in with the exact stored email works, and so does `legacy.user@test.local`.
  - `login-case-twins`: insert `Twin@Test.Local` and `twin@test.local` with different passwords. Each logs in with its exact email and its own password, and `TWIN@TEST.LOCAL` gets `401 AUTH_INVALID_CREDENTIALS` (ambiguous).
  - `login-validation` with body `{ email: 'nope' }` → `400 VALIDATION_FAILED`. `fields` has entries for `email` and `password`.
  - `me-ok`: `GET /api/auth` with a token → `ok`. `data.email` is the account's email and there is no `password` key.
  - `me-missing-token` → `401 AUTH_TOKEN_MISSING`.
  - `me-bad-token` with `Bearer x` → `401 AUTH_TOKEN_INVALID`.
  - `me-expired-token`: a token signed with the wrong secret, or expired, built locally with `jsonwebtoken` using a fake secret → `401 AUTH_TOKEN_INVALID`.
  - `signup-duplicate-case`: signup again with the uppercased email of an existing user → `409 EMAIL_IN_USE`.
  - `signup-validation`: password `abc` → `400`. `fields` has a `password` message about the 8-character minimum. The name `''` gets a `name` field error.
  - `signup-special-any`: the special-character rule accepts `?`. Signup of a fresh email with password `Abcdef1?` → `200`.
  - `username-limits`: `PUT /api/user/username` with 51 characters → `400 VALIDATION_FAILED` with field `username`. A valid name → `ok` with `data.name`.
  - `password-wrong-current`: `PUT /api/user/password` with a wrong `currentPassword` → `400 VALIDATION_FAILED` with field `currentPassword`. It is not 401, so the client keeps the session.
  - `malformed-json` on `POST /api/auth` → `400 BAD_REQUEST`.

- [ ] **Step 2: Run it. Expected FAIL** on the envelope cases.

- [ ] **Step 3: Implement.**
  - Routes use `defineApiHandler`, with `auth: true` where they use `checkAuth` today.
  - The controllers extend `BaseController`.
  - Signup creates the user and profile, with the email stored lowercase.
  - `updatePassword` throws `apiError.VALIDATION_FAILED(undefined, [{ field: 'currentPassword', message: "Your current password isn't right." }])` on a mismatch.
  - Remove `getResponseStatus` and `setResponseStatus` bookkeeping and the dead `if (!saved)` checks.

- [ ] **Step 4: Client.**
  - **`userStore`:** reads `accessToken`, sets `fieldErrors`, and uses `isAuthError` from `useErrorCheck`.
  - **`signup.vue`:**
    - shows `userStore.fieldErrors.name`, `.email` and `.password` through each `MclInputText`'s `:invalid` and `invalid-feedback`
    - builds the password pattern and the `passwordInvalid` check from `passwordRules`
  - **`reset-password.vue`:** uses the same `passwordRules`. Task 5 wires its field errors.

- [ ] **Step 5: Verify.**
  - Run `pnpm test` → all PASS.
  - Run `pnpm typecheck`.
  - App smoke:
    - log in through the UI
    - a signup with a short password shows the message under Password
    - reload `/`: you stay logged in with no redirect
    - change the username in the sidebar and restore it

- [ ] **Step 6: Commit.**
  - Message: `fix(server/controller): migrate auth and user routes to the envelope and harden login`

---

### Task 3: Plan routes

**Files:**

- Modify:
  - `server/api/plan/**`
  - `server/controller/plan/plan.controller.ts`
  - `shared/dto/plan/planInput.dto.ts`
  - `app/stores/planStore.ts`
- Test: `test/api/plans.test.ts`

**Interfaces:**

- **Consumes:** `BaseController.findOwnedPlan`, `requireUser` and `validateBody`. Tests use two users from `createUser()`.
- **Produces:**
  - `planInputSchema`: title trimmed 1–200, content at most 10,000 (optional), `type: z.enum(['personal', 'work', 'chore'])`, `complete` optional
  - `planInputCompleteSchema`, unchanged
  - Delete returns `{ id }`. The other plan routes return plan documents.

- [ ] **Step 1: Write `test/api/plans.test.ts`.** Cases (each test creates its own users and plans):
  - `list-ok` → `ok`, and `data` is an array.
  - `create-ok` → `ok`. `data.title` is trimmed (send `'  T  '` and expect `'T'`).
  - `create-validation`: title `''`, type `'bogus'`, and content of 10,001 characters → `400` with fields `title`, `type` and `content`.
  - `update-ok` and `toggle-ok` → `ok`, with changed values.
  - `delete-ok` → `ok`, with `data.id` equal to the plan ID. The plan is gone from the list.
  - `bad-id`: `PUT /api/plan/not-an-id` → `400 INVALID_ID`.
  - `missing-id`: a valid but unknown ObjectId → `404 PLAN_NOT_FOUND`.
  - `other-users-plan`: user B's plan, edited, toggled or deleted with user A's token → `403 FORBIDDEN` (not 401). The plan is unchanged.
  - `malformed-json` on `POST /api/plan` → `400 BAD_REQUEST`. Also delete `old-shape-still-works` from `core.test.ts`.
  - `no-token` on `GET /api/plan` → `401 AUTH_TOKEN_MISSING`.

- [ ] **Step 2: Run it. Expected FAIL.**

- [ ] **Step 3: Implement.**
  - **Controller:**
    - `getAllPostByUser` sorts by `updatedAt` descending, as today.
    - `createNewPlan` prepends the new ID to the profile's `plansOrder`, as today.
    - `updatePlan`, `togglePlanCompleteById` and `deletePlanById` use `findOwnedPlan`.
    - Delete also removes the ID from `plansOrder`.
  - **Routes:** `defineApiHandler({ auth: true, handler })`.

- [ ] **Step 4: Client.** In `planStore`, the toggle's success message still reads `res.complete`. Delete ignores `data`.

- [ ] **Step 5: Verify.**
  - Run `pnpm test` → all PASS.
  - Run `pnpm typecheck`.
  - App smoke: create, edit, complete and delete a plan, and drag-reorder in custom mode.

- [ ] **Step 6: Commit.**
  - Message: `fix(server/controller): migrate plan routes, return 403 for other users' plans`

---

### Task 4: Profile routes and picture upload

**Files:**

- Modify:
  - `server/api/profile/**`
  - `server/controller/profile/profile.controller.ts`
  - `server/utils/cloudinary.util.ts`
  - `shared/dto/profile/profileInput.dto.ts`
  - `app/stores/profileStore.ts`
- Test: `test/api/profile.test.ts`

**Interfaces:**

- **Produces:**
  - `profileInputSchema = { plansOrder: z.array(objectIdString).max(1000) }`, with no `dark` field. `objectIdString` is a Zod refinement using `mongoose.isValidObjectId`, exported from `shared/dto/common.ts` and also used by Task 5.
  - **`cloudinary.util.ts`:**
    - `readImageUpload(e: H3Event, key = 'image'): Promise<{ data: Buffer; mime: 'image/jpeg' | 'image/png' }>`
      - Throws `PAYLOAD_TOO_LARGE` when the `content-length` header or the actual size exceeds 5 MB.
      - Throws `UNSUPPORTED_MEDIA_TYPE` unless the first bytes are `FF D8 FF` (JPEG) or `89 50 4E 47 0D 0A 1A 0A` (PNG).
      - Throws `VALIDATION_FAILED` with field `image` when the field is missing.
    - `uploadImage(file): Promise<string>`: returns `public_id`. Cloudinary failure → `UPSTREAM_ERROR`.
    - `deleteCloudinaryImage(id)`
  - **The profile-picture route** no longer has `onRequest` upload middleware. The controller does: `requireProfile` → `readImageUpload` → `uploadImage` → save → delete the old image (best effort, with `console.error` on failure).

- [ ] **Step 1: Write `test/api/profile.test.ts`.** Cases:
  - `get-ok` → `ok`, with `data` the profile or `null`.
  - `create-exists`: `POST /api/profile` when one exists → `409 PROFILE_EXISTS`.
  - `order-ok`: `PUT /api/profile/plans-order` with the user's own plan IDs, reversed → `ok`, and the order persists.
  - `order-foreign-ids`: an order that includes another user's plan ID and a random valid ObjectId → `ok`. `data.plansOrder` contains only the user's own IDs.
  - `order-invalid` with `['nope']` → `400 VALIDATION_FAILED`, with a field starting with `plansOrder`.
  - `dark-ok`: toggle, then restore → `ok`.
  - `upload-fake-type`: a `.png` name with `image/png` MIME but text bytes → `415 UNSUPPORTED_MEDIA_TYPE`. The profile picture is unchanged.
  - `upload-too-large`: 5 MB plus 1 byte of PNG-header-prefixed bytes → `413 PAYLOAD_TOO_LARGE`.
  - `upload-missing-field`: multipart with no `image` → `400 VALIDATION_FAILED`, field `image`.
  - Don't test a real successful upload, because it writes to Cloudinary. The Task 8 smoke covers one real upload through the UI, and its new image replaces the previous one.

- [ ] **Step 2: Run it. Expected FAIL.**

- [ ] **Step 3: Implement** controller and routes per the Interfaces block. `updatePlansOrder` filters the IDs against `Plan.find({ _id: { $in }, author })`, keeping the request's order.

- [ ] **Step 4: Client.** `profileStore`'s reads already take `data` through the wrapper. Remove any `dark` key the client sends to plans-order, if one is sent.

- [ ] **Step 5: Verify.**
  - Run `pnpm test` → all PASS.
  - Run `pnpm typecheck`.
  - App smoke: reorder plans, toggle dark mode, and upload a profile picture through the sidebar (a real upload, once).

- [ ] **Step 6: Commit.**
  - Message: `fix(server/controller): migrate profile routes and validate uploads by content`

---

### Task 5: Password reset (send-token, reset-password)

**Files:**

- Modify:
  - `server/api/token/*`
  - `server/controller/token/token.controller.ts`
  - `shared/dto/token/*.ts`
  - `shared/models/token.model.ts` (comment only; the field still holds the hash)
  - `server/utils/sendEmail.util.ts`
  - `app/pages/auth/request.vue`
  - `app/pages/auth/reset-password.vue`
- Test: `test/api/reset.test.ts`

**Interfaces:**

- **Produces:**
  - `tokenEmailInputSchema = { email: emailSchema }`, with no `url`
  - `resetPwInputSchema = { userId: objectIdString, token: z.string().regex(/^[a-f0-9]{64}$/), password: passwordSchema }`
  - **`sendEmail(to, subject, text)`:** when `import.meta.dev` is true or `mailerTransport === 'log'`, it logs one line `"[mail] to=<to> text=<text with newlines as \n>"` with `console.info` and doesn't send. Otherwise it sends with SMTP as today, and a failure throws `UPSTREAM_ERROR`.
  - **Link format:** `${base}/auth/reset-password?user=<id>&token=<raw>`, where:
    - `base` = `import.meta.dev ? getRequestURL(e).origin : useRuntimeConfig().appUrl`
    - `appUrl` is the server-only config value added in Task 0
  - Both routes return `data: null`.

- [ ] **Step 1: Write `test/api/reset.test.ts`.** Reset links are read with `readMail(email)`, taking the last message and matching `/(https?:\/\/\S+\/auth\/reset-password\?user=(\w+)&token=(\w+))/`. Cases:
  - `unknown-email-generic` → `ok` with `data: null`. The same status and body as a known email. No mail is logged for that address.
  - `known-email-link`: the mailed link starts with `https://app.test/auth/reset-password?` (from `NUXT_APP_URL`), even when the request body includes `url: 'https://evil.example'`, an extra key that is stripped. The token is 64 hex characters.
  - `token-stored-hashed`: via `db()`, the stored `token` equals `sha256(raw)` and differs from the raw token.
  - `reset-ok`: `POST /api/token/reset-password` with the link's user and token and a new password → `ok`. Login with the new password works, and the old one fails.
  - `token-single-use`: reusing the same token → `400 RESET_TOKEN_INVALID`.
  - `token-replaced`: request two links, then use the first token → `400 RESET_TOKEN_INVALID`, and the second works.
  - `token-bad-format`: token `'abc'` → `400 VALIDATION_FAILED`, field `token`.
  - `mixed-case-email`: send-token for the uppercased email → a mail is logged to the account's address.

- [ ] **Step 2: Run it. Expected FAIL.**

- [ ] **Step 3: Implement.**
  - `sendToken` deletes any existing token for the user, creates a new raw token, and stores `sha256(raw)`.
  - `resetPasswordWithToken`:
    1. `findById(userId)` and look up the token by `{ userId, token: sha256(raw) }`. Either missing → `RESET_TOKEN_INVALID` with "This reset link is invalid or has expired. Please request a new one."
    2. Set the password.
    3. Delete the token.

- [ ] **Step 4: Client.**
  - **`request.vue`:** stop sending `url`, and on success show the alert "If an account exists for that email, we've sent a reset link."
  - **`reset-password.vue`:** show `fields.password` under the password input via `invalid-feedback`. `RESET_TOKEN_INVALID` shows its message in the alert.

- [ ] **Step 5: Verify.**
  - Run `pnpm test` → all PASS.
  - Run `pnpm typecheck`.
  - App smoke (dev server): request a reset through the UI, find the `[mail]` line in the dev server output, open the link, and reset the password (then restore it).

- [ ] **Step 6: Commit.**
  - Message: `fix(server/controller): build reset links server-side and use hashed single-use tokens`

---

### Task 6: Weather

**Files:**

- Modify:
  - `server/api/weather/index.get.ts`
  - Create `server/controller/weather/weather.controller.ts`, exported as `weatherController`
  - `app/components/widget/WeatherWidget.vue`
- Delete: `server/utils/checkAuth.util.ts` and `server/utils/buffer.util.ts` (if unused)
- Test: `test/api/weather.test.ts`

**Interfaces:**

- **Produces:** `GET /api/weather?lat&lon` (auth) returns `data: { city: string; temperature: number; condition: string; icon: string }`.
  - `condition` is OpenWeather's `weather[0].main`.
  - `icon` is its `weather[0].icon`, for example `'10d'`, matching `public/img/weather/<icon>.png`.
  - Query schema: `lat` from -90 to 90 and `lon` from -180 to 180, coerced numbers.
  - Upstream failure → `502 UPSTREAM_ERROR`, "Weather is unavailable right now."

- [ ] **Step 1: Write `test/api/weather.test.ts`.** Cases:
  - `no-token` → `401 AUTH_TOKEN_MISSING`.
  - `bad-coords` with `lat=999` → `400 VALIDATION_FAILED`, field `lat`.
  - The success path isn't tested here, because it would call the real OpenWeather API. The Task 8 smoke covers it through the UI against the dev server.

- [ ] **Step 2: Run it. Expected FAIL.**

- [ ] **Step 3: Implement** the controller and route. Then delete `checkAuth.util.ts` and confirm with `grep -rn checkAuth server` that nothing uses it.

- [ ] **Step 4: Client.** `WeatherWidget.vue` reads the trimmed shape. The rendered look is unchanged.

- [ ] **Step 5: Verify.**
  - Run `pnpm test` → all PASS.
  - Run `pnpm typecheck`.
  - The weather widget shows city and temperature in the sidebar.

- [ ] **Step 6: Commit.**
  - Message: `fix(server): require auth for weather and trim its response`

---

### Task 7: Rate limiting

**Files:**

- Create:
  - `shared/models/rateLimit.model.ts`, exported from `shared/models/index.ts`
  - `server/utils/rateLimit.ts`
- Modify:
  - `server/utils/defineApiHandler.ts` (call the limiter)
  - the auth, user signup and token routes (add `rateLimit`)
- Test: `test/api/ratelimit.test.ts`

**Interfaces:**

- **Produces:**
  - **Model `RateLimit`:** `{ key: string (unique), count: number, resetAt: Date }`, with a TTL index `expireAfterSeconds: 0` on `resetAt`.
  - **`server/utils/rateLimit.ts`:**
    - `type RateLimitName = 'login' | 'signup' | 'sendTokenIp' | 'sendTokenEmail' | 'resetPassword'`
    - `RATE_LIMITS: Record<RateLimitName, { max: number; windowSec: number }>`, holding the Global Constraints numbers
    - `hitRateLimit(e, name): Promise<void>`
      - The key is `${name}:${ip}`, where `ip` comes from `getRequestIP(e, { xForwardedFor: true }) ?? 'unknown'`.
      - For `sendTokenEmail` the key is `${name}:${normalizedEmail}`, read with `readBody` (h3 caches the body for the later `validateBody`).
      - Do an atomic `findOneAndUpdate`:
        - upsert, setting `resetAt = now + window` on insert
        - `$inc: { count: 1 }`
        - if `resetAt < now`, reset the count to 1 with a new `resetAt`, using an update pipeline or two-step logic
      - When `count > max`, throw `apiError.RATE_LIMITED()` with a `Retry-After` of `ceil((resetAt - now) / 1000)`.
  - **Route wiring:**

    | Route                            | Limiters                        |
    | -------------------------------- | ------------------------------- |
    | `POST /api/auth`                 | `login`                         |
    | `POST /api/user`                 | `signup`                        |
    | `POST /api/token/send-token`     | `sendTokenIp`, `sendTokenEmail` |
    | `POST /api/token/reset-password` | `resetPassword`                 |

- [ ] **Step 1: Write `test/api/ratelimit.test.ts`.** Each case uses its own fixed fake IP via `x-forwarded-for`. Cases:
  - `login-limit`: 10 wrong-password logins → `401`, then the 11th → `429 RATE_LIMITED` with a numeric `Retry-After` of at most 900. The envelope is correct.
  - `login-other-ip-unaffected`: the same credentials from another fake IP → `200`.
  - `send-token-email-limit`: 3 send-tokens for one user's email from different IPs → `200`, then the 4th → `429`.
  - `signup-limit`: 5 invalid signups (validation 400s still count) → the 6th → `429`.
  - Each run starts with a fresh memory database, so no rate-limit records survive between runs.

- [ ] **Step 2: Run it. Expected FAIL.**

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Verify.**
  - Run `pnpm test` → all PASS. The other tests use unique IPs per call, so they aren't affected.
  - Run `pnpm typecheck`.

- [ ] **Step 5: Commit.**
  - Message: `feat(server): rate-limit login, signup and password reset`

---

### Task 8: Remove the transition path, end-to-end smoke, build

**Files:**

- Modify: `app/composables/useApi.ts` and `app/composables/useErrorCheck.ts` (drop old-shape handling)
- Test:
  - `pnpm test`
  - `$SMOKE/e2e-smoke.mjs`: a throwaway Playwright and axe-core script outside the repo, in `/tmp/claude-1000/-mnt-projects-mango-planner-v2/681e34a4-2c0e-42fa-81d1-500f67b161c5/scratchpad/api-smoke/`. It runs against `pnpm dev` with `API_EMAIL` / `API_PASSWORD`.

- [ ] **Step 1: Write `e2e-smoke.mjs`.** It drives the UI with Playwright (`/usr/bin/google-chrome`). Cases:
  - `returning-user`: log in, then open `/` in a new page → `200 /` document, no `/auth/*` navigation, no hydration warning in the console.
  - `guest-redirect`: a fresh context on `/` → the server sends a 302 to `/auth/login`.
  - `invalid-token`: the cookie `access_token=Bearer%20x` → lands on `/auth/login` and the cookie is cleared.
  - `plans-flow`: create, edit, complete, reorder (Move menu) and delete a plan, each with its success alert.
  - `profile-upload`: upload `public/mango_planner_logo-192x192.png` as the profile picture → the success alert, and the image `src` changes.
  - `dark-toggle`: toggle on and off.
  - `weather`: only if geolocation is granted in the context (grant `geolocation` with Phoenix coordinates). The widget shows a temperature.
  - `signup-field-errors`: submit signup with a taken email and a weak password → the message under each field. Then axe (`wcag2a/aa/21a/21aa/22aa/best-practice`) shows 0 violations.
  - `reset-field-errors`: open the reset page with a dummy valid-format token and submit a weak password → the message under Password, and axe shows 0.
  - `login-wrong-password`: the alert "That email or password isn't right.", and the user is not logged out of anything (a fresh context, so this is just the alert).

- [ ] **Step 2: Run it** before removing the transition path → it should PASS. If it fails, fix the task that owns the flow.

- [ ] **Step 3: Remove the old-shape handling.** In `useApi` and `useErrorCheck`, a non-envelope response now becomes `UNKNOWN`. Then `grep -rn "statusMessage" app` → no remaining uses in client error handling.

- [ ] **Step 4: Verify.**
  - Run `pnpm test` → all PASS, and `node e2e-smoke.mjs` → all PASS.
  - Run `pnpm typecheck && pnpm build:local` → OK with no new warnings.
  - Run the production build (`PORT=3001 node .output/server/index.mjs`) and repeat the smoke cases `returning-user` and `plans-flow` against `BASE=http://localhost:3001`.

- [ ] **Step 5: Commit.**
  - Message: `refactor(app): drop the pre-envelope response handling`
  - Then open the PR as the finishing skill directs: `fix(server): API envelope, clearer errors and security hardening`. The body:
    - closes #19
    - lists the security fixes
    - notes the one-reload gap for open tabs at deploy
    - notes that `APP_URL` can override the reset-link base (defaults to the production URL)
    - notes the follow-ups: httpOnly cookie, session revocation, security headers
    - says the `test` CI job should become a required check after merge. That is a branch-protection change Claude makes only after asking.
