# API improvements (#19): design

## Why

The Nitro API in `server/` works, but it has three kinds of problems:

- **Security holes.** The worst is a password-reset link that an attacker can point at their own site.
- **Inconsistent responses and status codes.** Ownership failures return 401, which makes the client log the user out. Errors are hand-written `createError` blocks with mixed wording.
- **Repetition.** Every controller method re-fetches the user, profile or plan and re-checks ownership by hand.

The user wants the class-based MVC structure kept, a clear and predictable response format, and error messages people can understand.

## Goals

- **Start the project's test suite** (the user asked to fold it into this work): Vitest API tests under `test/api/`, run against a production build with an in-memory MongoDB, plus a GitHub Actions workflow that runs typecheck and the tests on every PR. Making it a required check is a branch-protection change made after the PR merges, with the user's OK.

- Every `/api/*` response uses one envelope (the shape the user chose):
  - Success: `{ "ok": true, "data": <payload> }`
  - Failure: `{ "ok": false, "error": { "code": "<ERROR_CODE>", "message": "<human-readable>", "fields"?: [{ "field": "<name>", "message": "<human-readable>" }] } }`
  - `fields` is present only for validation errors. The user asked for the list so forms can show a message per input.
- HTTP status codes stay meaningful and agree with `ok`.
- The security problems listed below are fixed.
- Controllers stay classes, but share their common lookups and checks instead of repeating them.
- Error messages are written for the person using the app: short, specific, and without internals.
- The app keeps working end to end. The client is updated to read the envelope.

## Non-goals

- **Restructuring the Pinia stores (#20).** In this work the stores only switch their `$fetch` calls to the shared wrapper described below and read errors through it.
- **Bigger auth changes:**
  - httpOnly cookies
  - refresh tokens
  - revoking other sessions after a password change
  - security headers and CSP

  These are noted as follow-ups.

- **The PWA offline fallback (#25).**

## Anti-goals (a failure even if every check passes)

- An existing user can't log in. This covers users whose stored email has capital letters and users with an existing valid token.
- Any page or flow in the app breaks because of the response change: login, signup, reset, plans, profile, weather.
- An error response leaks internals: stack traces, Mongoose messages, or whether a given email has an account (on forgot-password).
- A route becomes less protected than it is now.

## Constraints

- Follow CLAUDE.md:
  - API routes stay thin: `server/api/**/<name>.<method>.ts` only wires things together.
  - Logic lives in class-based controllers exported as singletons from `server/controller/index.ts`.
  - Request validation uses Zod schemas in `shared/dto/<domain>/`.
  - Prettier style and strict TypeScript.
- Don't read `.env*`. New configuration goes in `runtimeConfig` with safe defaults (see "Reset links").
- Work on branch `feat/api-improvements` as one PR that closes #19, with Conventional Commits scoped like `fix(server/controller)` or `refactor(server)`.
- The app runs on Vercel (serverless). Anything stateful, such as rate limiting, must not rely on in-process memory.

## Decided with the user

1. **The envelope shape above,** including the `fields` list for validation errors.
2. **Keep the OOP, class-based MVC pattern.**

## Design (Claude's calls unless marked otherwise)

### Envelope and error handling

- **Server helpers (`server/utils`, auto-imported):**
  - `ok(data)` builds the success body.
  - `class ApiError extends Error` carries `{ status, code, message, fields? }`.
  - A small factory or set of factories creates `ApiError`s from the error catalog below.
- **A route wrapper `defineApiHandler({ auth?, rateLimit?, handler })`** builds each route. In order, it:
  1. applies the rate limit, if configured
  2. runs the auth check, if `auth: true`
  3. calls the handler and wraps its return value in `ok(...)`
  4. turns any thrown error into the failure envelope with the right status:
     - `ApiError` is used as is.
     - Zod errors become `VALIDATION_FAILED` with `fields`.
     - h3 body-parse errors become `BAD_REQUEST`.
     - Mongoose `CastError` becomes `INVALID_ID`.
     - Anything else becomes `INTERNAL_ERROR` with a generic message. The real error is logged on the server only.

  Routes stay one-liners, for example `export default defineApiHandler({ auth: true, handler: planController.updatePlan })`.

- **Unknown `/api/*` paths:** a catch-all `server/api/[...].ts` returns `404 NOT_FOUND` in the envelope.
- **Status semantics:**

  | Status    | Meaning                                                                          |
  | --------- | -------------------------------------------------------------------------------- |
  | 400       | Bad input or validation                                                          |
  | 401       | Not authenticated: missing, invalid or expired token, or wrong login credentials |
  | 403       | Authenticated but not allowed, for example someone else's plan                   |
  | 404       | Missing resource                                                                 |
  | 409       | Conflict                                                                         |
  | 413 / 415 | Upload too large or wrong type                                                   |
  | 429       | Rate limited                                                                     |
  | 502       | Upstream failure: email, weather or image host                                   |
  | 500       | Unexpected                                                                       |

- **Ownership failures** (someone else's plan) return **403 `FORBIDDEN`**, not 401.
- **Error code catalog.** One TypeScript union or const object, shared in `shared/types` so the client can use it too:
  - `VALIDATION_FAILED`, `BAD_REQUEST`, `INVALID_ID`
  - `AUTH_TOKEN_MISSING`, `AUTH_TOKEN_INVALID`, `AUTH_INVALID_CREDENTIALS`
  - `FORBIDDEN`
  - `NOT_FOUND`, `USER_NOT_FOUND`, `PROFILE_NOT_FOUND`, `PLAN_NOT_FOUND`
  - `EMAIL_IN_USE`, `PROFILE_EXISTS`
  - `RESET_TOKEN_INVALID`
  - `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`
  - `RATE_LIMITED`
  - `UPSTREAM_ERROR`
  - `INTERNAL_ERROR`

  The builder may add codes if a case needs one, but should keep the list short.

- **Messages** are plain sentences, for example:
  - "That email or password isn't right."
  - "This plan doesn't exist or was deleted."
  - "Please sign in again."
  - "Too many attempts. Please wait a few minutes and try again."

  No "Bad Request:" prefixes and no internal terms. The exact wording is left to the builder within this tone.

- **Validation messages** come from the Zod schemas, which already exist with friendly messages for the password rules. Every field gets one.

### Success payloads

- **Login and signup:** `data: { accessToken: "Bearer <jwt>" }`. This is camelCase, and the client stores it in the cookie exactly as it does now.
- **Other routes:**
  - The current user, profile, plan list and single plan go in `data` as the documents. The user document never includes the password.
  - `GET /api/profile` with no profile returns `data: null`.
  - Delete returns `data: { id }`.
  - Password change and password reset return `data: null`.
  - Send-token returns `data: null`. The envelope has no success message, so the client shows its own fixed text: "If an account exists for that email, we've sent a reset link." (Claude's call, keeping the envelope exactly as the user chose.)
- **Weather:** `data: { city, temperature, condition, icon }`. The trimmed shape is what `WeatherWidget.vue` actually uses.
- **Drop the old fields:** the `status` and `message` fields inside success bodies go. The HTTP status carries that.

### Controllers

- **A `BaseController` class** that the controllers extend, with protected helpers:
  - `requireUser(e)`: loads the current user without the password, or throws `USER_NOT_FOUND`.
  - `requireProfile(userId)`: throws `PROFILE_NOT_FOUND`.
  - `findOwnedPlan(planId, userId)`: validates the ID (`INVALID_ID`), throws `PLAN_NOT_FOUND`, or throws `FORBIDDEN` when the plan belongs to someone else.
  - `validateBody(e, schema)`: wraps `readValidatedBody` so Zod errors become `VALIDATION_FAILED` with `fields`.
- **Remove dead checks,** such as `if (!saveData)` after `save()`, which throws on failure, and the `getResponseStatus` and `setResponseStatus` bookkeeping.
- **`hashPassword` and `signToken`** move into a small shared auth helper, either a utility or the base class. The token controller and auth controller should not have to create a `UserController` to reach them.
- **The auth check** (`checkAuth`) returns `AUTH_TOKEN_MISSING` or `AUTH_TOKEN_INVALID` (both 401). `jwt.verify` uses an explicit algorithm (`HS256`). JWT lifetime stays at 7 days.

### Security fixes

1. **Reset links.** The link's base URL comes from server config, never from the request body.
   - Add a server-only `runtimeConfig.appUrl`, defaulting to `https://mango-planner.bobbykim.dev`.
   - In development (`import.meta.dev`), the request origin is used so local testing works without new env vars.
   - The `url` field is removed from the send-token schema, and the client stops sending it.
2. **Reset tokens:**
   - Generate with `crypto.randomBytes(32).toString('hex')` and store only its SHA-256 hash.
   - The email link carries the raw token and the user ID.
   - On reset, hash the incoming token and compare.
   - Tokens are single use (deleted on success) and expire after 1 hour (the existing TTL).
   - A new request replaces any existing token for that user.
   - Old-format tokens already in the database simply expire.
3. **Account probing.** Send-token always returns the same success response (`data: null`), whether or not the email exists. The client shows the generic text. A failure while emailing an existing account still returns `502 UPSTREAM_ERROR`, which is acceptable. Signup keeps `409 EMAIL_IN_USE`, a normal trade-off.
4. **Rate limiting.** It is backed by MongoDB, since in-memory state doesn't survive serverless:
   - A `rateLimit` collection keyed by limiter name and client key, with a count and a TTL index on the window end.
   - The client key is the IP from `getRequestIP(e, { xForwardedFor: true })`. Vercel sets the header. For send-token it is also the normalized email.
   - Limits (Claude's numbers, tunable in one place):

     | Route          | Limit                                      |
     | -------------- | ------------------------------------------ |
     | Login          | 10 per 15 minutes per IP                   |
     | Signup         | 5 per hour per IP                          |
     | Send-token     | 5 per hour per IP and 3 per hour per email |
     | Reset-password | 10 per hour per IP                         |

   - Over the limit returns `429 RATE_LIMITED` with a `Retry-After` header.

5. **Input limits (Zod):**
   - Plan title: trimmed, 1–200 characters.
   - Plan content: at most 10,000 characters.
   - Plan type: an enum of `personal`, `work` or `chore`.
   - Username: trimmed, 1–50 characters.
   - Email: trimmed, lowercased and valid.
   - `plansOrder`: at most 1,000 entries, each a valid ObjectId. The server keeps only IDs of plans the user owns, so other users' or deleted plans can't be injected.
   - The `dark` field is removed from the plans-order schema. It has its own route.
6. **Password rule.** One shared definition, used by the server schema and the client forms.
   - The special-character rule becomes "at least one character that isn't a letter or number". This is the client's current rule, so a password the form accepts is never rejected by the server.
   - Export the regex or checks from `shared/dto/user` and use them in `signup.vue` and `reset-password.vue` instead of their copies.
7. **Email case.** Signup, login and send-token normalize email to lowercase and trimmed.
   - Production may already hold two accounts whose emails differ only by case. Lookups must not break either of them, and this work makes no index or data migration (Claude's call). Login and send-token therefore look up users like this:
     1. Try an exact match on the email as typed (trimmed), which is today's behaviour.
     2. If there's none, try the lowercased email.
     3. If there's still none, do a case-insensitive lookup (Mongo collation, strength 2), and use the result only if it matches exactly one user.
   - Anything ambiguous counts as no match. Login then returns `AUTH_INVALID_CREDENTIALS`, and send-token returns its generic response.
   - New signups are stored lowercase.
   - The signup duplicate check is case-insensitive: any match returns `409 EMAIL_IN_USE`.
   - The existing case-sensitive unique index stays. A race between two simultaneous signups that differ only by case is accepted.
8. **ObjectIds.** Route `:id` and body IDs are validated before querying (`INVALID_ID`), so they never cause a 500.
9. **Weather.**
   - It requires authentication. The widget only shows for logged-in users.
   - `lat` and `lon` are validated as numbers in range.
   - Upstream failures return `502 UPSTREAM_ERROR`.
10. **Profile picture upload:**
    - Check the size: at most 5 MB, otherwise `413 PAYLOAD_TOO_LARGE`. The client already compresses to about 1 MB.
    - Check the real type by the file's first bytes (JPEG or PNG), not the browser-supplied MIME type (`415`).
    - Load the profile before uploading, so a missing profile doesn't leave an orphaned image.
    - Delete the old image after a successful save. A failure there is only logged and doesn't fail the request.
11. **Database connection.** A failed connection logs the error instead of calling `process.exit`.

### Client changes (kept minimal; #20 restructures the stores)

- **A shared fetch wrapper, `useApi()`** (in `app/composables`), or an equivalent module:
  - It adds the `Authorization` header from `useAuthToken()` when present.
  - It returns `data` from a success envelope.
  - On failure it throws a typed `ApiClientError` carrying `{ status, code, message, fields }`. Network errors map to a friendly "Can't reach the server" message.
  - It works during SSR, as the stores call it on the server since #18.
- **All 19 call sites** switch to the wrapper:
  - `userStore`, `planStore` and `profileStore`
  - `WeatherWidget.vue`
  - `auth/request.vue` and `auth/reset-password.vue`
  - `auth/request.vue` stops sending `url`.
- **`useErrorCheck`:**
  - `extractErrorMessage` reads `ApiClientError.message`.
  - `isAuthError` becomes true only for `AUTH_TOKEN_MISSING` or `AUTH_TOKEN_INVALID`. A wrong password at login must not count as "session lost".
- **Field errors in forms:** the signup and reset-password forms show `fields` messages under the matching input, using `MclFormGroup`'s existing invalid-feedback. Other forms keep showing the alert. How the store hands `fields` to the page is the builder's call.

## Verification

- `pnpm typecheck` and `pnpm build:local` pass.
- **Vitest API tests** (`pnpm test`) cover:
  - the envelope shape and status on every route, for success and for each failure
  - `fields` on validation errors
  - a 404 for an unknown `/api` path
  - each security fix, using users the tests create in the in-memory database. That includes pre-existing mixed-case and case-twin accounts, which are inserted directly.
- **App flows still work.** The earlier #17 and #18 scripts lived in a session scratchpad that has since been cleared. Instead of rebuilding the whole #17 accessibility audit, this work adds a focused **end-to-end smoke script** (Playwright against `pnpm dev`; Claude's call). It covers:
  - login, including with a mixed-case email
  - signup of a throwaway user
  - request reset and reset, using a token created by a dev-only helper or read back from the database
  - create, edit, complete, reorder and delete plans
  - profile picture upload
  - the dark mode toggle
  - the weather widget
  - the #18 regressions:
    - a returning logged-in user lands on `/` with no detour or hydration warning
    - a guest is redirected to login
    - an invalid token goes to login with the cookie cleared
  - axe (WCAG 2.2 AA) on signup and reset-password while field errors are showing
- **Rate-limit records** created during tests are cleaned up, or expire on their own.

## Deploying

Tabs left open from before the deploy run the old client code until they reload. A login or signup in such a tab would read the old response shape and fail once. Each navigation fetches fresh server-rendered HTML, and the service worker uses `autoUpdate`, so a reload picks up the new code. This one-reload gap is accepted, with no compatibility shim (Claude's call). The PR description mentions it.

## Left to the builder

- **File layout under `server/utils`:**
  - `defineApiHandler`
  - `ApiError`
  - the rate limiter
  - the auth helpers
- **Error wording,** within the tone above.
- **How `fields` gets from the store to the signup and reset forms.**
- **Whether the rate-limit model lives in `shared/models`** next to the others (likely, for consistency) **or in `server/`**.
- **Commit split.**
