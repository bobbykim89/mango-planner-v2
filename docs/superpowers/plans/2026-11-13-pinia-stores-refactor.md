# Pinia Stores Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `app/stores/` so every API action runs through one shared runner and one session store owns sign-in, startup, logout and expiry. Store state updates from API responses instead of refetching, and the stores get unit tests.

**Architecture:**
- A `useStoreAction()` composable wraps each action body: cookie guard, success alert, error alert, `onError` hook, and expired session → `sessionStore.expire()`.
- `sessionStore` replaces `initPiniaStore`. It is the only store that imports other stores.
- Draft persistence moves to `useDrafts()`, and the custom-order sorting to `usePlansByOrder()`.
- A new Vitest `unit` project runs store tests in the Nuxt environment (happy-dom) with `registerEndpoint` mocks. The existing build-and-memory-DB tests become the `api` project.

**Tech Stack:** Nuxt 4.6.4, Pinia 3 setup stores, Vitest 5.1, `@nuxt/test-utils` 4.4.0, `happy-dom` 21.0.4, `@vue/test-utils` 2.4.6, localforage.

**Spec:** `docs/superpowers/specs/2026-11-13-pinia-stores-refactor-design.md`

## Global Constraints

- **No user-visible change** except the spec's listed fixes:
  - the double login alert, and the "Successfully authenticated user" alert on every load
  - the alert timer
  - consistent expiry handling
  - the lost draft after a failed draft save
  - new plans showing at the bottom of the custom order until a reload
- **No server, API, `useApi` or `ApiClientError` changes.**
- **Pinia setup stores only** (`defineStore('id', () => { ... })`).
- **Store dependencies:** `userStore`, `profileStore` and `planStore` must not import or call each other. Only `sessionStore` imports them. `useStoreAction` reaches `useSessionStore()` only inside its expired-session branch.
- **Actions never throw.** They resolve to `true` on success and `false` otherwise. Exception: `planStore.createPlan` resolves to the created `PlanDto` or `null` (see Task 5).
- **Guard browser-only APIs** (localforage, window) with `import.meta.client`.
- **Drafts:**
  - IndexedDB database `MangoPlannerV2`, store `drafts`
  - record shape `{ data, timestamp }`
  - keys `'new'` or the plan ID
- **Expiry:**
  - An auth error is `ApiClientError` code `AUTH_TOKEN_MISSING` or `AUTH_TOKEN_INVALID` (`useErrorCheck().isAuthError`).
  - Expiry clears the cookie and all store state except the alert, shows the server's message, and calls `navigateTo('/auth/login')` once.
- **Success alert copy** (unchanged): `Login Successful!`, `Signup Successful!`, `Successfully updated username!`, `Successfully updated user password!`, `Logout Successful!`, `Successfully created user profile!`, `Successfully updated profile picture!`, `` `Darkmode ${dark ? 'enabled' : 'disabled'}` ``, `Successfully created new plan!`, `Successfully updated plan!`, `` `Successfully marked the plan ${complete ? 'completed' : 'incomplete'}` ``, `Successfully deleted plan!`
- **Style:** Prettier (single quotes, no semicolons, 2-space indent). Conventional Commits with scope.
- **Checks:** `pnpm test` runs both Vitest projects; CI is unchanged. `pnpm typecheck` must pass.

## Review Focus

1. **Expiry while the user is on `/`:** after the redirect, the login page still shows the server's message. `clearAll()` must not clear the alert store. The test is in Task 2.
2. **Wrong password at login:** `AUTH_INVALID_CREDENTIALS` is not an auth error. The user must stay on the page and see the alert, with no expiry or redirect. The test is in Task 3.
3. **Existing users' drafts:** records written by the old code (`{ data, timestamp }` under `'new'` or a plan ID) still show up in `drafts`. The test is in Task 5.
4. **A user with no profile yet:** `GET /api/profile` returns `null`. `userProfile` stays `null`, `darkMode` stays `false`, and `usePlansByOrder` returns the plans unchanged. Tests are in Task 4 and Task 5.
5. **Logging out, then signing in as someone else:** no plans, drafts list, profile or field errors carry over from the previous user. The test is in Task 2.

---

### Task 1: Unit test project and the alert timer fix

**Files:**
- Modify: `package.json` and `pnpm-lock.yaml` (dev deps)
- Modify: `vitest.config.ts`
- Create: `.nuxtrc`, written by `@nuxt/test-utils`. Commit it.
- Create: `test/unit/helpers.ts`
- Create: `test/unit/alertStore.test.ts`
- Modify: `app/stores/alertStore.ts`
- Modify: `CLAUDE.md` (the Tests note)

**Interfaces:**
- Produces, in `test/unit/helpers.ts`:
  - `resetState(): void` sets a fresh Pinia (`setActivePinia(createPinia())`) and sets `useAuthToken().value = null`.
  - `signIn(token = 'Bearer test'): void` sets the cookie.
  - `ok<T>(data: T)` returns `{ ok: true, data }`.
  - `fail(event, status: number, code: string, message: string)` calls `setResponseStatus(event, status)` (import from `'h3'`) and returns `{ ok: false, error: { code, message } }`.
  - `mockApi(method, url, handler): void` calls `registerEndpoint(url, { method, handler })` and keeps the returned cleanup.
  - `clearApiMocks(): void` runs and forgets all kept cleanups. Call it in `afterEach`.
  - `memoryLocalforage()`, an in-memory stand-in for `localforage.createInstance` (`getItem`, `setItem`, `removeItem`, `keys`), used with `vi.mock('localforage', ...)`. happy-dom has no IndexedDB.
- The test files themselves mock `navigateTo`, since the mock must be hoisted per file:

  ```ts
  const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
  mockNuxtImport('navigateTo', () => navigateToMock)
  ```

- [ ] **Step 1: Install the dev dependencies**

  Run: `pnpm add -D @nuxt/test-utils@4.4.0 happy-dom@21.0.4 @vue/test-utils@2.4.6`

  Expected: the install succeeds. A peer warning about jsdom (because of the `jsdom: 25.0.1` override) is expected. `.nuxtrc` appears.

- [ ] **Step 2: Split `vitest.config.ts` into two projects**
  - **`api`:**
    - include `test/api/**/*.test.ts` and `test/pages/**/*.test.ts`
    - `globalSetup: ['test/setup/global.ts']`
    - `fileParallelism: false`, `testTimeout: 30_000`, `hookTimeout: 300_000`
  - **`unit`:** `await defineVitestProject({ test: { name: 'unit', include: ['test/unit/**/*.test.ts'], environment: 'nuxt', environmentOptions: { nuxt: { domEnvironment: 'happy-dom' } } } })` from `@nuxt/test-utils/config`.

  This exact shape was verified on 2026-11-13: both projects ran under `pnpm test`, and the global setup ran only for `api`.

- [ ] **Step 3: Write `test/unit/helpers.ts` and the failing alert test**

  ```ts
  // test/unit/alertStore.test.ts (vi.useFakeTimers in beforeEach)
  it('keeps a newer alert for its full 5 s even if an older one was set before', () => {
    const alert = useAlertStore()
    alert.setAlert('first')
    vi.advanceTimersByTime(3000)
    alert.setAlert('second', 'success')
    vi.advanceTimersByTime(2500) // the first alert's timer would fire here
    expect(alert.alert).toBe('second')
    expect(alert.alertColor).toBe('success')
    vi.advanceTimersByTime(2500)
    expect(alert.alert).toBeNull()
    expect(alert.alertColor).toBe('danger')
  })
  ```

- [ ] **Step 4: Run it**

  Run: `pnpm vitest run --project unit`

  Expected: FAIL. `alert.alert` is `null` at the 5.5 s mark.

- [ ] **Step 5: Fix `alertStore`**

  Keep the pending `setTimeout` handle in the store's closure. `setAlert` and `clearAlert` clear it before starting a new one. The public API (`alert`, `alertColor`, `setAlert(message, color = 'danger')`, `clearAlert(timeout = 5000)`) is unchanged.

- [ ] **Step 6: Run the unit tests, then everything**

  Run: `pnpm vitest run --project unit && pnpm test && pnpm typecheck`

  Expected: all pass.

- [ ] **Step 7: Update the Tests note in `CLAUDE.md`**

  Two Vitest projects:
  - `api`: build plus in-memory MongoDB, `test/api`, `test/pages`
  - `unit`: Nuxt environment with happy-dom, `test/unit`, API mocked with `registerEndpoint` via `test/unit/helpers.ts`

  `pnpm vitest run --project unit` runs only the fast tests.

- [ ] **Step 8: Commit**

  `test(app/stores): add a unit test project and fix the alert clear timer`

---

### Task 2: Action runner and session store

**Files:**
- Create: `app/composables/useStoreAction.ts`
- Create: `app/stores/sessionStore.ts`
- Delete: `app/stores/initPiniaStore.ts`
- Modify: `app/stores/index.ts`
- Modify: `app/stores/userStore.ts`, `app/stores/profileStore.ts`, `app/stores/planStore.ts`: rename the clear functions only (`clearUserStore`/`clearProfileData`/`clearPlanData` → `clear`)
- Modify: `app/plugins/init.plugin.ts`, `app/middleware/authRoute.ts`, `app/middleware/guestRoute.ts`, `app/pages/index.vue`, `app/pages/auth/login.vue`, `app/pages/auth/signup.vue`, `app/layouts/default.vue`
- Test: `test/unit/useStoreAction.test.ts`, `test/unit/sessionStore.test.ts`

**Interfaces:**
- Produces, in `useStoreAction.ts`:

  ```ts
  export interface StoreActionOptions<T> {
    requireAuth?: boolean                        // default true: return false, no request, when the cookie is empty
    success?: string | ((result: T) => string)   // success alert ('success' colour)
    onError?: (err: unknown) => void | Promise<void> // runs first on any failure
    expireOnAuthError?: boolean                  // default true
  }
  export type RunStoreAction = <T>(fn: () => Promise<T>, opts?: StoreActionOptions<T>) => Promise<boolean>
  export const useStoreAction: () => RunStoreAction
  ```

  Call `useStoreAction()` once at the top of a store's setup. It captures `useAuthToken()`, `useAlertStore()`, `useErrorCheck()` and `useNuxtApp()`.

  Failure handling:
  1. `await opts.onError?.(err)`.
  2. If it's an auth error and `expireOnAuthError !== false`: `await nuxtApp.runWithContext(() => useSessionStore().expire(message))`.
  3. Otherwise: `console.error(message)` and `setAlert(message)`.

  In both cases the result is `false`. `message` is `useErrorCheck().extractErrorMessage(err)`.
- Produces, in `sessionStore.ts`: `useSessionStore` (id `'session'`) with:
  - `loading: Ref<boolean>` (initially `true`) and `mounted: Ref<boolean>` (initially `false`)
  - `init(): Promise<void>`. For now it calls the existing `userStore.getCurrentUser()`, then, when authenticated, the profile and plan fetches. It sets `loading = false` and `mounted = true`. Task 3 rewrites it.
  - `logout(): void` calls `clearAll()`, then shows `setAlert('Logout Successful!', 'success')`.
  - `expire(message: string): Promise<void>`. If an expiry is already running, it returns. Otherwise it calls `clearAll()`, shows `setAlert(message)`, and awaits `navigateTo('/auth/login')`. The in-progress flag lives in the store's closure and resets in `finally`.
  - `clearAll(): void` sets `useAuthToken().value = null` and calls `clear()` on the user, profile and plan stores. It leaves the alert alone.
- Each domain store's `clear()` resets all of its state, including `planStore.drafts` and `userStore.fieldErrors`.

- [ ] **Step 1: Write the failing runner tests** in `test/unit/useStoreAction.test.ts`

  Exercise the runner through a throwaway setup store defined in the test file, e.g. `defineStore('t', () => ({ run: useStoreAction() }))`.
  - **`skips the request without a session cookie`:** with the cookie empty and an endpoint mock that counts calls, `run(() => api('/api/x'))` resolves `false`, the mock is called 0 times, and the alert is `null`.
  - **`resolves true and shows the success alert`:** `success: 'Done!'` gives `true`, and alert `'Done!'` with colour `'success'`. A function form `success: (r) => \`got ${r}\`` receives the result.
  - **`shows the error message and resolves false`:** the endpoint returns `fail(e, 404, 'PLAN_NOT_FOUND', "That plan doesn't exist.")`. The result is `false`, the alert is `"That plan doesn't exist."` with colour `'danger'`, and `navigateToMock` is not called.
  - **`runs onError before the default handling`:** `onError` receives an `ApiClientError` with `code === 'PLAN_NOT_FOUND'`.
  - **`expires the session on an auth error`:** the endpoint returns `fail(e, 401, 'AUTH_TOKEN_INVALID', 'Please sign in to continue.')`. The result is `false`, `navigateToMock` is called with `'/auth/login'`, the cookie is `null`, and the alert is `'Please sign in to continue.'`.
  - **`does not expire when expireOnAuthError is false`:** with the same 401, `navigateToMock` isn't called and the alert shows the message.

- [ ] **Step 2: Write the failing session tests** in `test/unit/sessionStore.test.ts`
  - **`expire clears every store but keeps the alert, then redirects once`:**
    - Setup: the user, profile, plans, drafts and `fieldErrors` are seeded, and the cookie is set.
    - Act: run `await Promise.all([expire('A'), expire('B')])`.
    - Expect: all are cleared, the cookie is `null`, `navigateToMock` was called exactly once with `'/auth/login'`, and the alert is `'A'`.
  - **`logout clears everything and confirms`:**
    - Setup: as above.
    - Expect: everything is cleared, the alert is `'Logout Successful!'` with `'success'`, and `navigateToMock` is not called (the layout routes).
  - **`clearAll leaves nothing behind for the next user`** (Review Focus 5):
    - Setup: seed every store.
    - Act: `clearAll()`.
    - Expect: `plans`, `drafts`, `userProfile`, `darkMode`, `currentUser`, `isAuthenticated` and `fieldErrors` are all back to their initial values.

- [ ] **Step 3: Run them**

  Run: `pnpm vitest run --project unit`

  Expected: FAIL, because the modules don't exist.

- [ ] **Step 4: Implement `useStoreAction` and `sessionStore`**
  - Delete `initPiniaStore`, rename the three clear functions to `clear`, and export `useSessionStore` from `app/stores/index.ts`.

- [ ] **Step 5: Update the callers**
  - **`init.plugin.ts`:** use `useSessionStore()`. Keep the hydration short-cut (when `mounted` is already true on the client, only load drafts).
  - **The middleware:** read `mounted` from `useSessionStore()`.
  - **`index.vue`:** read `mounted` from `useSessionStore()`.
  - **`login.vue` and `signup.vue`:** call `useSessionStore().init()` instead of `initStores()`.
  - **`default.vue`:** `onLogout` calls `useSessionStore().logout()` instead of `userStore.logoutUser()`. Remove `logoutUser` from `userStore`.

- [ ] **Step 6: Run everything**

  Run: `pnpm test && pnpm typecheck`

  Expected: all pass, including `test/pages/ssr.test.ts`.

- [ ] **Step 7: Commit**

  `refactor(app/stores): add the shared action runner and a session store`

---

### Task 3: User store on the runner, single sign-in fetch

**Files:**
- Modify: `app/stores/userStore.ts`, `app/stores/sessionStore.ts`
- Modify: `app/pages/auth/login.vue`, `app/pages/auth/signup.vue`, `app/middleware/authRoute.ts`, `app/middleware/guestRoute.ts`, `app/layouts/default.vue`
- Test: `test/unit/userStore.test.ts`, `test/unit/sessionStore.test.ts` (extend), `test/pages/ssr.test.ts` (extend)

**Interfaces:**
- Consumes: `useStoreAction`, `useSessionStore` (Task 2).
- Produces, in `userStore`:
  - **State:** `currentUser: Ref<UserDto | null>`, `isAuthenticated: Ref<boolean>`, `fieldErrors: Ref<Record<string, string>>`
  - **`fetchCurrentUser(): Promise<boolean>`**
    - `GET /api/auth`, then set `currentUser` and set `isAuthenticated = true`.
    - Runner options: `expireOnAuthError: false`, and `onError` that, on an auth error, sets the cookie to `null` and calls `clear()`.
    - No success alert. The default error alert stays.
  - **`login(payload: AuthInput): Promise<boolean>`**
    - `POST /api/auth`, then set the cookie to `res.accessToken`.
    - Options: `requireAuth: false`, success `'Login Successful!'`, and `onError` that sets `fieldErrors = fieldMap(err)`.
    - Doesn't fetch the user.
  - **`signup(payload: UserInput): Promise<boolean>`:** same as `login` against `POST /api/user`, with `'Signup Successful!'`.
  - **`updateUsername(payload: NewUsernameInput): Promise<boolean>`:** `PUT /api/user/username` returns the updated user; set `currentUser` from it. Shows `'Successfully updated username!'`. Field errors as in `login`.
  - **`updatePassword(payload: PwUpdateInput): Promise<boolean>`:** `PUT /api/user/password`, then `'Successfully updated user password!'`. No refetch. Field errors as in `login`.
  - **`clear(): void`**
  - **Field errors:** every action except `fetchCurrentUser` first sets `fieldErrors.value = {}`.
  - **Removed:** `authUser`, `getCurrentUser`, `loginWithCredential`, `signupNewUser`, `getCurrentAuthInfo`, and the imports of `planStore`/`profileStore`.
- **`sessionStore.init()`:**
  1. `await userStore.fetchCurrentUser()`.
  2. If `isAuthenticated`: `await Promise.all([` the profile fetch `,` the plans fetch `])`.
  3. On the client, load the drafts.
  4. `loading = false`, `mounted = true`.

  No success alert.
- **Pages:** `login.vue` and `signup.vue` run `if (await userStore.login(cred)) { await sessionStore.init(); if (userStore.isAuthenticated) router.push({ path: '/' }) }` (signup likewise).
- **Middleware:** reads `storeToRefs(userStore).isAuthenticated` and `storeToRefs(sessionStore).mounted`.

- [ ] **Step 1: Write the failing tests**
  - **`userStore.test.ts`:**
    - **`login stores the token and shows one success alert`:** POST returns `ok({ accessToken: 'Bearer abc' })`. Result `true`, cookie `'Bearer abc'`, alert `'Login Successful!'`, and a counting `GET /api/auth` mock called 0 times.
    - **`login with a wrong password keeps the user on the page`** (Review Focus 2): POST returns `fail(e, 401, 'AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect.')`. Result `false`, alert shows that message, `navigateToMock` not called, cookie still `null`.
    - **`signup maps validation errors to fieldErrors`:** POST returns `{ ok: false, error: { code: 'VALIDATION_FAILED', message: 'x', fields: [{ field: 'email', message: 'Enter a valid email address.' }] } }` with status 400, giving `fieldErrors` `{ email: 'Enter a valid email address.' }`. The next `signup` call clears it before its request.
    - **`updateUsername uses the response instead of refetching`:** PUT returns `ok({ _id: 'u1', name: 'New', email: 'a@b.c' })`. Then `currentUser.name === 'New'`, and the counting `GET /api/auth` mock is called 0 times.
    - **`fetchCurrentUser with a stale cookie clears it without redirecting`:** the GET returns `fail(e, 401, 'AUTH_TOKEN_INVALID', 'Please sign in to continue.')`. Result `false`, cookie `null`, `isAuthenticated` false, `navigateToMock` not called.
  - **`sessionStore.test.ts`:** `init fetches the user once and shows no success alert`. Mock `GET /api/auth`, `/api/profile` and `/api/plan`, and count the auth calls. After `init()`: auth called once, alert `null`, `mounted` true.
  - **`ssr.test.ts`** (a regression guard; it may already pass): `a stale cookie keeps public pages public`. With the cookie `access_token=Bearer%20invalid`, `/about` returns 200 and `/` returns 302 with `location` `/auth/login`.

- [ ] **Step 2: Run them**

  Run: `pnpm vitest run --project unit`

  Expected: the new unit tests FAIL (unknown actions, double fetch).

- [ ] **Step 3: Implement the `userStore` and `sessionStore.init` changes, then update the pages, middleware and `default.vue`**

  `default.vue` keeps calling `updateUsername`/`updatePassword`. Their payloads are unchanged.

- [ ] **Step 4: Run everything**

  Run: `pnpm test && pnpm typecheck`

  Expected: all pass.

- [ ] **Step 5: Commit**

  `refactor(app/stores): move the user store onto the runner and fetch the user once at sign-in`

---

### Task 4: Profile store on the runner

**Files:**
- Modify: `app/stores/profileStore.ts`
- Modify: `app/stores/sessionStore.ts` (calls)
- Modify: `app/layouts/default.vue`, `app/pages/index.vue`
- Test: `test/unit/profileStore.test.ts`

**Interfaces:**
- Consumes: `useStoreAction` (Task 2).
- Produces, in `profileStore`:
  - **State:** `userProfile: Ref<ProfileDto | null>`, `darkMode: Ref<boolean>`
  - **Getter:** `getPlansOrder: ComputedRef<string[]>` (`[]` when there's no profile)
  - **Actions** (`setProfile` below sets `userProfile = p` and `darkMode = p?.dark ?? false`):
    - `fetchProfile(): Promise<boolean>`: `GET /api/profile` returns `ProfileDto | null`, then `setProfile`
    - `createProfile(): Promise<boolean>`: `POST /api/profile`, then `'Successfully created user profile!'`
    - `updateProfilePicture(form: FormData): Promise<boolean>`: `PUT /api/profile/profile-picture`, then `'Successfully updated profile picture!'`
    - `updatePlansOrder(plansOrder: string[]): Promise<boolean>`: `PUT /api/profile/plans-order` with body `{ plansOrder }`. No alert.
    - `toggleDarkMode(payload: ProfileInputDark): Promise<boolean>`: `PUT /api/profile/dark`, with success `(p) => \`Darkmode ${p.dark ? 'enabled' : 'disabled'}\``

    Each of these sets state from its response.
  - **Local mirroring:**
    - `addPlanToOrder(id: string): void` prepends `id` to `userProfile.plansOrder` if a profile exists and the ID isn't already there.
    - `removePlanFromOrder(id: string): void` removes it.
  - **`clear(): void`**
  - **Removed:** the `userStore` import and the old names (`getCurrentUserProfile`, `postNewUserProfile`, `updateUserProfilePicture`, `updateUserPlansOrder`, `toggleUserDarkMode`).
- **Callers:**
  - **`default.vue`:** uses `createProfile`, `updateProfilePicture` and `toggleDarkMode`.
  - **`index.vue`:** `onOrderUpdate` calls `updatePlansOrder(itemsOrder)` and drops the extra `getCurrentUserProfile()`.

- [ ] **Step 1: Write the failing tests** in `profileStore.test.ts`
  - **`fetchProfile with no profile leaves defaults`** (Review Focus 4): GET returns `ok(null)`, giving result `true`, `userProfile` `null`, `darkMode` `false` and `getPlansOrder` `[]`.
  - **`toggleDarkMode uses the response and names the new state`:** PUT returns `ok({ ...profile, dark: true })`. Then `darkMode` is true, the alert is `'Darkmode enabled'`, and the counting `GET /api/profile` mock is called 0 times.
  - **`updatePlansOrder sets the returned order without refetching`:** the response's `plansOrder` is applied, and GET is called 0 times.
  - **`addPlanToOrder and removePlanFromOrder mirror the server`:** starting from `['b', 'c']`, `addPlanToOrder('a')` gives `['a', 'b', 'c']`, adding `'a'` again changes nothing, and `removePlanFromOrder('b')` gives `['a', 'c']`. Without a profile, both do nothing.

- [ ] **Step 2: Run them**

  Run: `pnpm vitest run --project unit`

  Expected: FAIL (unknown actions).

- [ ] **Step 3: Implement the changes and update the callers**

- [ ] **Step 4: Run everything**

  Run: `pnpm test && pnpm typecheck`

  Expected: all pass.

- [ ] **Step 5: Commit**

  `refactor(app/stores): move the profile store onto the runner and use API responses`

---

### Task 5: Plan store on the runner, drafts and custom order split out

**Files:**
- Create: `app/composables/useDrafts.ts`, `app/composables/usePlansByOrder.ts`
- Modify: `app/stores/planStore.ts`, `app/stores/sessionStore.ts` (calls), `app/plugins/init.plugin.ts` (draft load), `app/pages/index.vue`
- Modify: `CLAUDE.md` (the "Client state" convention)
- Test: `test/unit/planStore.test.ts`, `test/unit/useDrafts.test.ts`, `test/unit/usePlansByOrder.test.ts`

**Interfaces:**
- Consumes: `useStoreAction` (Task 2), and `profileStore.addPlanToOrder`/`removePlanFromOrder`/`getPlansOrder` (Task 4).
- Produces, in `useDrafts.ts`:
  - The lazy `createInstance` (with `driver: localforage.INDEXEDDB`, `name: 'MangoPlannerV2'`, `storeName: 'drafts'`) moves here unchanged.
  - `useDrafts(): { save(key: string, data: PlanInput): Promise<void>; get(key: string): Promise<(PlanInput & { id: string }) | null>; remove(key: string): Promise<void>; list(): Promise<DraftFormInput[]> }`
  - Records are `{ data, timestamp: Date.now() }`.
  - Every method is a no-op returning `null` or `[]` on the server. Each catches and `console.error`s storage failures.
  - No `console.log`.
- Produces, in `usePlansByOrder.ts`: `usePlansByOrder(): ComputedRef<PlanDto[]>`. It uses today's `getPlansByOrder` sorting: IDs missing from `plansOrder` go last, and an empty order or empty plans returns a copy of `plans`.
- Produces, in `planStore`:
  - **State:** `plans: Ref<PlanDto[]>`, `drafts: Ref<DraftFormInput[]>`
  - **Getters:** `getAllPlans` (incomplete first) and `getIncompletePlans`, unchanged
  - **Actions:**
    - **`fetchPlans(): Promise<boolean>`:** `GET /api/plan`. No draft reload.
    - **`createPlan(input: PlanInput): Promise<PlanDto | null>`:** prepends the returned plan, shows `'Successfully created new plan!'`, and resolves to the plan. On failure it saves a draft under `'new'` and resolves to `null`.
    - **`updatePlan(payload: { id: string; body: PlanInput }): Promise<boolean>`:** removes the old copy and prepends the returned plan, then shows `'Successfully updated plan!'`. On failure it saves a draft under `id`.
    - **`togglePlanComplete(payload: { id: string; body: PlanInput }): Promise<boolean>`:** `PUT /api/plan/:id/toggle`. Same move-to-front rule, then the completed/incomplete alert.
    - **`deletePlan(id: string): Promise<boolean>`:** removes by the returned `id`, then `'Successfully deleted plan!'`.
    - **`loadDrafts(): Promise<void>`:** `drafts = await useDrafts().list()`.
    - **`getDraft(key)`:** `useDrafts().get(key)`; when it's missing, `setAlert('Failed to retrieve draft')` and resolve `undefined`.
    - **`deleteDraft(key): Promise<void>`:** removes from storage and from `drafts`.
    - **`clear(): void`**
  - The internal save-on-failure persists the draft and inserts or replaces it in `drafts` at once.
  - **Removed:** the `userStore`/`profileStore` imports, `getPlansByOrder`, and every "Post" name.
- **`index.vue`:**
  - `const plansByOrder = usePlansByOrder()` replaces every `planStore.getPlansByOrder`.
  - A local `createAndOrder(input)` runs `const plan = await planStore.createPlan(input); if (plan) profileStore.addPlanToOrder(plan._id.toString()); return plan`. Both create paths use it.
  - After a successful `deletePlan(id)`, call `profileStore.removePlanFromOrder(id)`.
  - `onDraftSave` calls `planStore.deleteDraft(selectedDraft.value)` only when the save succeeded (`createAndOrder` returned a plan, or `updatePlan` returned `true`).
  - Rename the remaining calls to the new action names.
- **`init.plugin.ts`:** the hydration short-cut calls `usePlanStore().loadDrafts()`.

- [ ] **Step 1: Write the failing tests** (`vi.mock('localforage', ...)` with `memoryLocalforage()` from the helpers)
  - **`planStore.test.ts`:**
    - **`updatePlan moves the returned plan to the front without refetching`:**
      - Setup: `plans` are `[A, B, C]`.
      - Act: the PUT for `C` returns `ok({ ...C, title: 'C2' })`.
      - Expect: `plans.map(p => p.title)` is `['C2', 'A', 'B']`, and a counting `GET /api/plan` mock is called 0 times.
    - **`togglePlanComplete applies the response and names the state`:** `getAllPlans` lists the toggled plan after the incomplete ones, and the alert is `'Successfully marked the plan completed'`.
    - **`deletePlan removes by the returned id`:** DELETE returns `ok({ id: 'b' })`, giving `plans` without `b`, result `true`, and GET called 0 times.
    - **`a failed create saves the draft and lists it at once`:**
      - Act: POST returns `fail(e, 500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.')`.
      - Expect: `createPlan` resolves `null`, `drafts` contains `{ id: 'new', data: input }` without a reload, and the stored record under `'new'` has `data` equal to the input and a numeric `timestamp`.
    - **`a failed update keeps the draft under the plan id`:** `drafts` contains an entry with `id === 'p1'`.
  - **`useDrafts.test.ts`:** `reads drafts written by the old code` (Review Focus 3). Pre-seed the memory store with `'new'` set to `{ data: { title: 't', content: '', type: 'personal' }, timestamp: 1 }` and `'p1'` likewise. `list()` returns both with `id` and `data`, and `get('p1')` returns `{ id: 'p1', title: 't', ... }`.
  - **`usePlansByOrder.test.ts`:**
    - **`sorts by plansOrder with unknown ids last`:** plans `[a, b, c]` with the order `['c', 'a']` give `[c, a, b]`.
    - **`returns plans unchanged without a profile`** (Review Focus 4).

- [ ] **Step 2: Run them**

  Run: `pnpm vitest run --project unit`

  Expected: FAIL (missing modules and actions).

- [ ] **Step 3: Implement `useDrafts`, `usePlansByOrder` and the `planStore` changes, then update `sessionStore`, `init.plugin.ts` and `index.vue`**

- [ ] **Step 4: Check the dependency rule**

  Run: `grep -nE "use(User|Profile|Plan)Store|from '\./(user|profile|plan)Store'" app/stores/userStore.ts app/stores/profileStore.ts app/stores/planStore.ts; grep -rniE "\bPost(s)?\b|createNewPost|updatePost|deletePost|getAllPostByUser" app/stores app/pages app/composables`

  Expected: no output.

- [ ] **Step 5: Update the "Client state" convention in `CLAUDE.md`**
  - Stores are initialised by `init.plugin.ts` calling `useSessionStore().init()`.
  - Store actions wrap their body in `useStoreAction()` (guard, alerts, expiry) and update state from the API response.
  - Only `sessionStore` combines stores.
  - Drafts persist via `useDrafts()`.

- [ ] **Step 6: Run everything**

  Run: `pnpm test && pnpm typecheck`

  Expected: all pass.

- [ ] **Step 7: Commit**

  `refactor(app/stores): move the plan store onto the runner and split out drafts and custom order`

---

### Task 6: Manual check in the running app

**Files:** none, unless a defect turns up. A defect gets a failing unit test first, then a fix commit.

- [ ] **Step 1: Start the dev server**

  Run: `pnpm dev`

  Use a throwaway test account in the local dev database, never production.

- [ ] **Step 2: Walk the flows, watching the network panel and the alerts**
  - **Load:** reloading `/` while signed in makes exactly one `GET /api/auth`, and shows no "Successfully authenticated user" alert.
  - **Login:** one `GET /api/auth` after the POST, and one "Login Successful!" alert. A wrong password shows the error and stays on the page.
  - **Plans:** create, edit, toggle and delete each make one request with no follow-up `GET /api/plan`. An edited plan moves to the top of its group, and a new plan appears at the top of the custom order.
  - **Reorder:** a Move-menu reorder sends one `PUT /api/profile/plans-order` and no profile GET.
  - **Drafts:** with the API stopped (or offline in devtools), saving a new plan keeps a draft that shows at once. Saving that draft while still offline keeps it. Saving it once back online removes it.
  - **Profile:** dark mode, username, password and profile picture.
  - **Expiry:** with the cookie changed to `Bearer x` in devtools, any action redirects to `/auth/login` and shows "Please sign in to continue."
  - **Logout,** then sign in as a second account: no data from the first account.

- [ ] **Step 3: Record the results** in the PR description.
