# Pinia stores refactor (#20): design

## Intent

Issue #20 asks for `app/stores/` to have a clearer structure, with the repeated parts moved into reusable composables, so a maintainer can understand the client state quickly. The repeated parts are the auth-guarded API calls, error handling, alerts and logout/redirect.

Issue #19 already gave the stores a typed API client (`useApi()` returns `data` from the `{ ok, data }` envelope and throws `ApiClientError` with a `code`). This refactor builds on that client and leaves it as it is.

The user has not changed the stores themselves since. They approved the direction below as proposed. Items marked *(my call)* were decided by Claude and are open to correction.

## Problems in the current code

1. **Every API action repeats the same steps.** All 14 actions in `userStore`, `profileStore` and `planStore` follow `if (!cookie.value || !isAuthenticated) return` → `try` → `api(...)` → `alertStore.setAlert(..., 'success')` → `catch` → a local `handleXError`.
2. **Three different behaviours for an expired session.** When an action fails with `AUTH_TOKEN_MISSING` or `AUTH_TOKEN_INVALID`:
   - `userStore` clears only the user.
   - `profileStore` clears only the profile.
   - `planStore` clears all three and redirects to `/auth/login` after 1 s.

   None of them clears the cookie except `getCurrentUser`.
3. **The stores import each other in a circle.**
   - `userStore` imports `planStore` and `profileStore`, only for logout.
   - `profileStore` imports `userStore`.
   - `planStore` imports `userStore` and `profileStore`.

   Each calls the others' `useXStore()` at the top of its setup function.
4. **Duplication at login and signup.**
   - `authUser` and `getCurrentUser` are near-duplicates.
   - `login.vue` and `signup.vue` call `loginWithCredential`/`signupNewUser`, which fetch `/api/auth`, then call `initPiniaStore.initStores()`, which fetches `/api/auth` again and shows a second success alert ("Successfully authenticated user").
5. **Full refetches after every change.**
   - `updatePost`, `toggleComplete` and `deletePost` reload every plan with `getAllPostByUser()`, which also reloads the drafts. The API already returns the updated plan (PUT routes) or `{ id }` (DELETE).
   - `updateUserPlansOrder` gets the updated profile back, yet `index.vue` calls `getCurrentUserProfile()` again right after it.
   - `postNewUserProfile`, `updateUserProfilePicture` and `toggleUserDarkMode` refetch the profile instead of using their responses.
6. **Naming and placement.**
   - Plan actions are named "Post" (`createNewPost`, `updatePost`, `deletePost`, `getAllPostByUser`), but the app calls them plans everywhere else.
   - The offline-drafts code (localforage/IndexedDB) lives inside `planStore`.
   - `initPiniaStore` is really the app's session bootstrap.
7. **Alert timer bug.** `alertStore.setAlert` starts a new 5 s `setTimeout` without cancelling the previous one, so an older alert's timer can clear a newer alert early.

## Goals

- **One way to run a store action.** The guard, error handling, alerts and the expired-session path live in one place, so each action body is "call the API, update state".
- **One session owner.** Sign-in, startup loading, logout and "session expired" belong to one composable. Domain stores no longer import each other.
- **The same expired-session behaviour everywhere:** clear the cookie and all store state, show the server's message, then redirect to `/auth/login`.
- **State updated from API responses,** with no refetch after a change.
- **Drafts in their own module.** "Post" becomes "Plan" in names.
- **Automated tests for the client state code,** which currently has none.

## Non-goals

- No change to what users see or can do, apart from the bug fixes listed here:
  - the double login alert, and the "Successfully authenticated user" alert on every load
  - the alert timer
  - consistent expiry handling
  - the lost draft after a failed draft save
  - new plans showing at the bottom of the custom order until a reload
- No change to the server, the API, or `useApi`/`ApiClientError`.
- No move away from Pinia or from setup stores (`defineStore('x', () => { ... })`).
- No redesign of the components. Callers change only where a store's API is renamed or moved, a duplicate call is removed, or a listed bug is fixed (the draft data-loss fix in `index.vue`).
- Not part of this work:
  - the image-upload size issue (a separate follow-up)
  - the PWA offline fallback (#25)

## Anti-goals (a failure even if it works)

- An abstraction harder to read than the repetition it replaces. A maintainer should understand the action helper in one short read.
- Hydration regressions or new SSR errors. The server already initialises the stores from the request cookie (#18), and that has to keep working.
- Any lost path that saves a draft when creating or updating a plan fails.

## Design

### Shape after the refactor

```text
app/stores/
  alertStore.ts      alert text + colour; setAlert cancels the previous timer
  userStore.ts       currentUser, isAuthenticated, fieldErrors; login/signup/username/password
  profileStore.ts    userProfile, darkMode, plansOrder getter; profile actions
  planStore.ts       plans + getters; plan CRUD (renamed from "Post")
  sessionStore.ts    replaces initPiniaStore: loading, mounted; init(), logout(), expire()
  index.ts
app/composables/
  useStoreAction.ts  the shared action runner (below)
  useDrafts.ts       draft persistence (localforage), moved out of planStore
```

*(My call:)* `initPiniaStore` becomes `sessionStore` (a Pinia store, because `loading`/`mounted` must hydrate from SSR). The orchestration lives there instead of in a plain composable. Callers (`init.plugin.ts`, the middleware, `index.vue`, `login.vue`, `signup.vue`) are updated.

### The action runner: `useStoreAction`

One small function that wraps an action body:

- **Guard.** With `requireAuth` (the default), the action returns early, without calling the API, unless the session cookie is set. Login, signup and the session check opt out.
- **Success.** If a success message is given, it shows it as a success alert. The message may be a function of the result (for example "Darkmode enabled/disabled", "marked the plan completed/incomplete").
- **Failure:**
  - An expired session (`useErrorCheck().isAuthError`) goes to `sessionStore.expire()`. The runner looks up the session store lazily, only on that error path, never at setup time (see "No more cycles").
  - Any other error shows its message as a danger alert and is logged with `console.error`.
  - An optional `onError` hook runs first. The plan store uses it to save the draft, and the user store to fill `fieldErrors` from `fieldMap(err)`.
- **Contract.** Actions never throw to their callers. They resolve to `true` on success and `false` otherwise, so a page can act on the outcome instead of checking store state. Existing callers that ignore the result keep working.

The exact signature is left to the builder.

### Session: `sessionStore`

- **`init()`:** replaces `initStores()`.
  - When the cookie is set, it fetches the current user; when authenticated, it also fetches the profile and the plans.
  - It sets `loading`/`mounted` as today. It shows no success alert: the "Successfully authenticated user" alert on every page load goes away.
  - A stale cookie found at startup does **not** go through `expire()`. *(My call, keeping today's behaviour:)* `init()` clears the cookie and user state and shows the server's message, but doesn't redirect. A visitor on a public page (`/about`, `/info`, `/auth/*`) stays there, and only `authRoute` sends people from protected pages to the login page. So the session check opts out of the runner's expiry path, and no server-side `navigateTo` is added to the plugin. Add an SSR test: a request with an invalid `access_token` cookie to a public page returns 200, and to `/` returns 302 to `/auth/login`.
  - It runs on the server and the client exactly as today (`init.plugin.ts`, including the hydration short-cut that only loads drafts on the client).
- **`logout()`:** clears the cookie and every store, then shows "Logout Successful!".
- **`expire()`:**
  - clears the cookie and every store
  - shows the server's message (for example "Please sign in to continue.")
  - redirects to `/auth/login`

  *(My call:)* it redirects immediately instead of waiting the current 1 s. The alert lives in a store, so it stays visible across the navigation. If two failing calls trigger it at the same time, the second does nothing.
- **Login/signup orchestration.** `login.vue` and `signup.vue` call the user store's login/signup action and then `init()` exactly once. The user is fetched once and one success alert appears. How this is split between `userStore` and `sessionStore` is left to the builder.
- **No more cycles.** Each domain store exposes its own `clear()` (or `$reset`-style) function. Only `sessionStore` imports the others. `userStore`, `profileStore` and `planStore` must not import or call each other. *(My call:)* the one remaining module-level loop (domain store → `useStoreAction` → `sessionStore` → domain store) is acceptable because the runner calls `useSessionStore()` only inside its expired-session branch, at runtime, never during any store's setup.
- **Custom order.** `getPlansByOrder` combines plans with the profile's `plansOrder`, so it can't stay in `planStore`. *(My call:)* it moves to a small composable (for example `usePlansByOrder()`) that reads both stores and keeps the same sorting, with unknown IDs last. `index.vue` uses it instead of `planStore.getPlansByOrder`.

### Plan store

- **Names:**
  - `getAllPostByUser` → `fetchPlans`
  - `createNewPost` → `createPlan`
  - `updatePost` → `updatePlan`
  - `toggleComplete` → `togglePlanComplete`
  - `deletePost` → `deletePlan`

  Getters keep their names (`getAllPlans`, `getIncompletePlans`, `getPlansByOrder`). *(My call:)* exact names are the builder's, as long as no "Post" remains.
- **Local updates.** These must leave `plans` in the order a reload would give. `GET /api/plan` sorts by `updatedAt`, newest first, and both PUT routes set `updatedAt`, so today's refetch moves an edited or toggled plan to the top of its group:
  - Create already prepends the returned plan.
  - Update and toggle remove the old copy and prepend the returned document. `getAllPlans` still groups incomplete before completed.
  - Delete removes the plan by the returned `id`.

  None of them refetch or reload drafts.
- **`plansOrder` is kept in step:** the server prepends a new plan's ID to the profile's `plansOrder` and removes deleted IDs. *(My call:)* the client mirrors this locally, so the custom-order view matches what a reload would show. Today a new plan appears at the bottom of that view until the page is reloaded. The plan store must not import the profile store for this; the session store or the calling page does the mirroring.
- **Drafts on failure:** when create or update fails, the input is still saved as a draft (keys `'new'` and the plan ID, as today). `index.vue`'s use of `drafts`, `getDraft` and `deleteDraft` keeps working.
- **Draft data-loss fix.** *(My call; this fixes an existing bug and is required by the anti-goal.)* In `index.vue`, `onDraftSave` always deletes the open draft after saving. When the save fails, the store re-saves the draft under the same key, and the page then deletes it straight away, so the draft is lost. `onDraftSave` must delete the draft only when the save action returns `true`. Also, a draft saved after a failure must appear in the reactive `drafts` list immediately, not only after a reload (today it only showed up via the success-path refetch).

### Drafts: `useDrafts`

- **What moves:** the localforage instance (`createInstance` with name `MangoPlannerV2`, store `drafts`, IndexedDB) and `saveDraft`, `getDraft`, `deleteDraft` and `loadAllDrafts` move out of `planStore`.
- **What stays:**
  - the same database, store name and record shape (`{ data, timestamp }`), so existing users' drafts still load
  - the `import.meta.client` guards
  - the lazy `createInstance` from #18
- **Where the state lives:** *(My call:)* the reactive `drafts` list stays in Pinia state, either in `planStore` or a small `draftStore`, because components read it through `storeToRefs`. The persistence code lives in the composable.
- **Cleanup:** the `console.log` lines go. Failures keep using `console.error`.

### Profile store

- Uses the action runner.
- Sets `userProfile` from the responses to create, picture upload, dark mode and plans-order instead of refetching.
- `index.vue` drops the extra `getCurrentUserProfile()` after reordering.

### User store

- Uses the action runner.
- `authUser` and `getCurrentUser` merge into one `fetchCurrentUser`.
- `fieldErrors` behaviour is unchanged: it is cleared when an action starts and filled from `fieldMap(err)` on `VALIDATION_FAILED`.
- `getCurrentAuthInfo` goes. The middleware reads `isAuthenticated` (and `sessionStore.mounted`) directly.

### Alert store

- `setAlert` cancels the pending clear timer before it starts a new one.
- The API (`alert`, `alertColor`, `setAlert`, `clearAlert`) is unchanged.

## Testing

- **Setup.** Add `@nuxt/test-utils` and `happy-dom` (dev only) and split Vitest into two projects:
  - `api`: the existing tests, with the build/memory-DB global setup
  - `unit`: new, with the Nuxt environment and no app build

  `pnpm test` runs both, and CI keeps calling `pnpm test`.
- **Why happy-dom.** The jsdom environment would need jsdom ≥ 27.4, which conflicts with the `jsdom: 25.0.1` pin from #27. `@nuxt/test-utils` lists jsdom as an optional peer, so pnpm may print a peer warning; that's expected and harmless.
- **What the unit tests cover** (store and composable tests with the API mocked, e.g. `registerEndpoint` or a mocked `$fetch`):
  - the runner's guard
  - success and error alerts
  - expired-session handling, which clears everything, redirects and runs only once
  - draft-on-failure
  - local plan updates, including the edited plan moving to the top and `plansOrder` mirroring
  - the draft from a failed save appearing in `drafts` immediately
  - the alert-timer fix
  - `init()` fetching the user once and showing no success alert
- **Existing tests.** The API suite and the SSR page tests (`test/pages/ssr.test.ts`, which renders `/` for a signed-in user) must keep passing. They are the check that server-side init and hydration still work.
- **Manual check in `pnpm dev`:** login, signup, plan CRUD, reorder, drafts after a failed save, dark mode, profile picture, and logout.

## Left to the builder

- exact function signatures, file names and the action runner's options
- whether drafts state sits in `planStore` or a small `draftStore`
- the split of login orchestration between `userStore` and `sessionStore`
- how tests mock the API
- commit breakdown (Conventional Commits with scopes, e.g. `refactor(app/stores): ...`)
