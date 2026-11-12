# Accessibility (#17) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Mango Planner meet WCAG 2.2 AA in light and dark mode, for keyboard and screen-reader users, while keeping today's look apart from the agreed changes.

**Architecture:**

- Mostly template and CSS changes in the existing components.
- New pieces:
  - a light-mode amber-text token in `styles.css`
  - one new component, `PlanMoveMenu.vue` (the drag handle that is also a menu button)
  - one pure helper, `app/utils/reorderPlans.ts`
- Announcements use Nuxt's built-in `<NuxtAnnouncer>` / `useAnnouncer()` and `<NuxtRouteAnnouncer>` (Nuxt 4.6.4).
- Library fixes come from bumping the MCL packages.

**Tech Stack:**

- App: Nuxt 4.6.4, Vue 3.5, Tailwind 4 (`@tailwindcss/vite`), vuedraggable 4.1 (SortableJS 1.14), `@bobbykim/manguito-theme` 1.5 / `mcl-forms` 0.12.4 / `mcl-footer` 0.10.8.
- Checks: Playwright-core and axe-core 4.14 against `pnpm dev`.

**Spec:** `docs/superpowers/specs/2026-11-11-accessibility-design.md`. Read it first. It holds the decisions and the reasons behind them; this plan only says how to carry them out.

## Global Constraints

- **Target:** WCAG 2.2 AA (axe tags `wcag2a wcag2aa wcag21a wcag21aa wcag22aa best-practice`), in light and dark mode, at 1280 px and 390 px.
- **Amber text in light mode:** `#735107`. Amber backgrounds, borders, outlines, radios and spinners stay `#f1ac18`. Dark mode is unchanged.
- **Work and chore card headers and footer bars in light mode:** 40% tint (was 60%). Open panels stay at `/25`.
- **Type label:** full-opacity `dark-3`, or `light-3` in dark mode, with no `opacity-60`.
- **Markdown links on work and chore panels in light mode:** `dark-3` text with a 2 px `#f1ac18` underline. Personal panels keep `#735107` links.
- **No other visual changes** beyond the spec's "Visible changes" list. Dragging must feel exactly as it does now. No new hydration warnings; guard browser-only code with `import.meta.client`.
- **Conventions:** follow CLAUDE.md (Prettier: single quotes, no semicolons, 2-space indent; strict TS). Commits use Conventional Commits with a scope, e.g. `fix(app/components): ...`, and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Branch:** `feat/accessibility`, delivered as one PR that closes #17. Commit or push only when the user has asked (they asked for this PR flow).
- **Secrets:** never read `.env*`. The test account password comes from the person running the work, as env vars `A11Y_EMAIL` / `A11Y_PASSWORD`. Never write it to a file in the repo, a commit or the PR.
- **Test data:** delete every plan you create. The test account itself stays, because there is no delete endpoint.
- **Dark mode is stored on the user profile:** `default.vue` forces light mode unless `userProfile.dark`. Logged-in dark checks must toggle the DarkmodeWidget and toggle it back afterwards. This is by design, not a bug.

## Review Focus

1. **Rapid repeated moves.** Pressing ↓ several times quickly, or choosing menu items quickly while `onOrderUpdate` is still saving, must not lose or revert moves. Expected: moves are ignored while a save is in flight, and the final order matches what the user saw (Task 5, step 1, case `rapid`).
2. **A custom list with one plan.** All four menu items are disabled, and ↑/↓ on the handle do nothing without errors (Task 5, case `single`).
3. **Very long plan titles.** They wrap inside the header button, the Move menu stays fully visible and isn't clipped by the card, and accessible names include the full title (Task 4 case `long-title`; Task 5 case `menu-visible`).
4. **Search text with regex characters.** Typing `(` or `[` currently throws in `getPlans` because the term goes straight into `new RegExp`. The count announcement reads `getPlans`, so it would throw too. Expected: no error, and the count is announced (Task 7, case `regex`).
5. **Deleting the last plan in the list.** Focus moves to the list heading, not to `<body>` (Task 7, case `delete-last`).

---

## Check harness (used by every task)

There is no test framework yet; Vitest is planned separately. Each task's "failing test" is therefore a Playwright check script, run against `pnpm dev` (port 3000, `.env.local` DB).

- **Location:** the scripts live outside the repo, in `$CHECKS` = `/tmp/claude-1000/-mnt-projects-mango-planner-v2/681e34a4-2c0e-42fa-81d1-500f67b161c5/scratchpad/a11y-checks/`. If the directory is gone, recreate it from this section.
- **Exit codes:** each `check-*.mjs` exits 0 when every assertion passes. Otherwise it prints `FAIL <case>: <reason>` lines and exits 1.
- **Run:** `cd $CHECKS && A11Y_EMAIL=... A11Y_PASSWORD=... node check-<name>.mjs`.
- **Dev server:** start it in the background with `pnpm dev > $CHECKS/dev.log 2>&1`, and wait until `curl -sf http://localhost:3000/auth/login` succeeds.

---

### Task 1: Library bump, check harness, baseline

**Files:**

- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Create: `$CHECKS/package.json` (outside the repo)
- Create: `$CHECKS/lib.mjs`
- Create: `$CHECKS/audit.mjs`
- Commit: `docs/superpowers/specs/2026-11-11-accessibility-design.md`, `docs/superpowers/plans/2026-11-11-accessibility.md`

**Interfaces (Produces, `lib.mjs`). Every later check imports these:**

- `launch({ width = 1280, height = 900, touch = false }) -> Promise<{ browser, ctx, page }>`
  - Chrome lives at `/usr/bin/google-chrome`.
  - The page records `console` errors and warnings, plus `pageerror`, in `page.__errors: string[]`.
  - It auto-accepts `confirm()` dialogs.
- `login(page) -> Promise<void>`
  - Fills `#email` and `#password` from `process.env.A11Y_EMAIL` / `A11Y_PASSWORD`, submits, and waits for `/` and `networkidle`.
  - Throws if either env var is missing.
- `createPlans(page, plans: { title: string, type: 'personal'|'work'|'chore', content?: string }[]) -> Promise<void>`
  - Uses the desktop form (`#desktop-new-title`, `#desktop-new-content`, the `label[for="desktop-new-type-<type>"]` click, then Save).
  - Default content: ``'Notes with [a link](https://example.com) and `code`.'``
- `deletePlans(page, titles: string[]) -> Promise<void>`
  - Deletes each plan through its card's delete control, opening the card first when needed.
  - It must find the delete button by its accessible name, both before and after Task 4: `/^(delete|Delete ".*")$/`.
  - It never throws on an already-missing plan.
- `withCleanup(page, titles, fn) -> Promise<void>`
  - Runs `fn` in `try/finally`, and the `finally` calls `deletePlans`.
- `setDark(page, on: boolean) -> Promise<void>`
  - Opens the sidebar from the username button, then clicks the dark-mode control only if `document.documentElement.classList.contains('dark') !== on`.
  - Before Task 6 the control is found by `aria-label="toggle dark mode"`; after Task 6 by role `switch` named "Dark mode".
- `axeScan(page, { rules?: string[] }) -> Promise<{ id: string, impact: string, target: string, summary: string }[]>`
  - Injects `axe-core/axe.min.js`, runs it with the Global Constraints tags (or only `rules` when given), and drops nodes whose target contains `nuxt-devtools`.
- `focusRing(page) -> Promise<{ desc: string, visible: boolean }>`
  - Describes `document.activeElement`.
  - **Waits 400 ms first:** `.btn` animates `outline-width`, and reading it immediately gives a false "no ring".
  - `visible` is true when the computed outline has a style other than `none` and a width above 0, or when `box-shadow` is not `none`.
- `report(failures: string[]) -> never`
  - Prints the failures, then calls `process.exit(failures.length ? 1 : 0)`.

**Interfaces (Produces, `audit.mjs`):**

- `node audit.mjs [--only=<rule,...>]`: runs `axeScan` in every state below and prints `[impact] rule: state :: target :: summary` for each violation. Exit code 1 if any.
  - guest at 1280 px, in light and dark (dark via `localStorage['nuxt-color-mode']='dark'` before load): `/auth/login`, `/auth/signup`, `/auth/request`, `/about`, `/info`, `/does-not-exist`
  - logged in, using plans `A11y work` (work), `A11y chore` (chore) and `A11y personal` (personal), all created by `createPlans`:
    - the list
    - each of the three cards expanded, one at a time, since the AccordionGroup keeps only one open
    - the edit modal opened on `A11y work`
    - the sidebar with "Update Password" open
    - custom mode
    - custom mode with the Move menu open (from Task 5 on; skip quietly while there is no button named `/^Move "/`)
  - each logged-in state once in light and once in dark (`setDark(page, true)`, and `setDark(page, false)` in `finally`)
  - widths 1280 px and 390 px

- [ ] **Step 1: Create the harness.**
  - `mkdir -p $CHECKS && cd $CHECKS && npm init -y && npm i playwright-core@1.56.1 axe-core@4.14.0`
  - Write `lib.mjs` and `audit.mjs` to the interfaces above.

- [ ] **Step 2: Run the baseline audit on current master code.**
  - Start `pnpm dev` and run `node audit.mjs > baseline.txt`.
  - Expected: exit 1. The violations include `color-contrast`, `button-name`, `nested-interactive`, `label-content-name-mismatch`, `aria-dialog-name`, `landmark-one-main`, `page-has-heading-one`, `region` and `landmark-unique`.
  - Keep `baseline.txt` for the PR description.

- [ ] **Step 3: Bump the libraries.**
  - In `package.json`: `@bobbykim/manguito-theme` `^1.5.0`, `@bobbykim/mcl-footer` `^0.10.8`, `@bobbykim/mcl-forms` `^0.12.4`.
  - In `pnpm-workspace.yaml`, replace the three old MCL `minimumReleaseAgeExclude` entries with `'@bobbykim/manguito-theme@1.5.0'`, `'@bobbykim/mcl-footer@0.10.8'` and `'@bobbykim/mcl-forms@0.12.4'`.
  - Then run `pnpm install`.

- [ ] **Step 4: Verify the bump.**
  - Run `pnpm typecheck && pnpm build:local`. Expected: both succeed.
  - Rerun `node audit.mjs --only=aria-dialog-name,button-name`. Expected: the Alert dismiss button no longer appears under `button-name`.

- [ ] **Step 5: Commit.**
  - `git add package.json pnpm-lock.yaml pnpm-workspace.yaml docs/superpowers`
  - `git commit -m "chore(package.json): bump MCL packages for accessibility fixes" -m "Adds the #17 design and implementation plan." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`

---

### Task 2: Colour and contrast

**Files:**

- Modify: `app/assets/css/styles.css`
- Modify: `app/assets/css/md-content.scss`
- Modify: `app/components/layout/AuthBlock.vue`
- Modify: `app/components/plans/PlanCollapsable.vue` (`getBgColor`, `getContentBgColor`, type label)
- Modify: `app/layouts/default.vue` (Alert content colour)
- Modify: `app/components/plans/UtilityBlock.vue` and `app/components/plans/MobileUtilityBlock.vue` (search label)
- Test: `$CHECKS/check-contrast.mjs`

**Interfaces:**

- Produces:
  - CSS custom property `--color-warning-text`: `#735107` in light mode, `var(--color-warning)` under `.dark`.
  - Tailwind utility `text-warning-text`, generated from `@theme { --color-warning-text: ... }`.

- [ ] **Step 1: Write `check-contrast.mjs`.**
  - It runs `audit.mjs`'s logged-in and guest state list with `axeScan(page, { rules: ['color-contrast'] })`.
  - Cases:
    - `light-guest`
    - `dark-guest`
    - `light-<type>-expanded` and `dark-<type>-expanded` for each of work, chore and personal
    - `light-alert-success`: triggered by creating a plan, which shows "Successfully created new plan!"
    - `light-alert-danger`: triggered by a failed login with a wrong password, on a fresh context
    - `mobile-utility-open`: at 390 px, open the utility block with the "toggle utility block" button
  - Each case asserts zero `color-contrast` violations, and each failure prints the ratio and colours.

- [ ] **Step 2: Run it. Expected FAIL.**
  - At least `light-guest` (`#f1ac18` on `#e8e8e8`, 1.6:1), `light-work-expanded` (title 3.5:1), `light-alert-success` (2.19:1) and the dark type-label cases.

- [ ] **Step 3: Add the amber text token in `styles.css`.**
  - Add `--color-warning-text: #735107` to an `@theme` block.
  - Override it under `.dark` with `var(--color-warning)`.
  - Add an unlayered rule `:root:not(.dark) .text-warning { color: var(--color-warning-text); }`. This covers the app's own uses and the MCL-internal ones too: the footer title and footer social icons, which come from `title-color="warning"` and `social-icon-color="warning"`.
  - Do not touch `--color-warning` itself.

- [ ] **Step 4: Point the remaining amber text at the token.**
  - **`md-content.scss`:** `code` and `a` colours use `var(--color-warning-text)`.
  - **Tinted panels:** in light mode only, links inside work and chore panels get `color: var(--color-dark-3)`, `text-decoration-color: var(--color-warning)` and `text-decoration-thickness: 2px`. Scope them with a class that `PlanCollapsable` adds to the panel content wrapper for work and chore only, e.g. `md-content--tinted`.
  - **`AuthBlock.vue`:** replace `md:text-warning md:dark:text-warning` with `md:text-warning-text`.

- [ ] **Step 5: Card tints and type label in `PlanCollapsable.vue`.**
  - **`getBgColor`:** work → `'bg-info/40 dark:bg-info'`, chore → `'bg-primary/40 dark:bg-primary'`. Personal is unchanged.
  - **Type label `<span>`:** replace `opacity-60` with explicit `text-dark-3 dark:text-light-3`, keeping `text-xs justify-self-end`.

- [ ] **Step 6: Alert and search icon.**
  - **`default.vue` Alert content `div`:** the class is `text-dark-3` when `alertColor === 'success'` and `text-light-1` otherwise, as a computed `alertTextClass`. If `light-alert-danger` still fails, use `text-dark-3` there too.
  - **Search `<label>` in both utility blocks:** `text-light-1` becomes `text-dark-3`.

- [ ] **Step 7: Run `check-contrast.mjs`. Expected PASS on all cases.**
  - Then compare screenshots of `/auth/login` and `/` with a work card expanded against the spec's options, by eye:
    - headings are `#735107`
    - buttons stay bright amber
    - work and chore headers are paler

- [ ] **Step 8: Run `pnpm typecheck`.**

- [ ] **Step 9: Commit.**
  - Message: `fix(app): meet colour contrast for amber text, card tints and alerts`

---

### Task 3: Page structure, landmarks, headings, announcers, motion

**Files:**

- Modify: `app/app.vue`
- Modify: `app/layouts/default.vue` (skip link, `<main>`, header title, logo link)
- Modify: `app/error.vue`
- Modify: these pages, for their headings:
  - `app/pages/auth/login.vue:59`
  - `app/pages/auth/signup.vue:67`
  - `app/pages/auth/request.vue:60`
  - `app/pages/auth/reset-password.vue:70`
  - `app/pages/about.vue:53`
  - `app/pages/info.vue:28`
  - `app/pages/index.vue`
- Modify: `app/pages/info.vue:38-128` (the example buttons)
- Modify: `app/assets/css/page_transition.scss`
- Modify: `app/assets/css/styles.css` (scroll padding)
- Modify: `index.vue` `<style>` (reduced motion)
- Modify: every app `.vue` file with a decorative inline `<svg>`
- Test: `$CHECKS/check-structure.mjs`

**Interfaces:**

- Produces:
  - `<NuxtAnnouncer />` rendered once in `app.vue`. Later tasks call `useAnnouncer().polite(message)`.
  - `<main id="main" tabindex="-1">` in `default.vue`.

- [ ] **Step 1: Write `check-structure.mjs`.**
  - Pages: `/auth/login`, `/auth/signup`, `/auth/request`, `/about`, `/info`, `/does-not-exist`, and logged-in `/`.
  - Cases:
    - `h1`: exactly one `h1` per page.
    - `main`: exactly one `main`, and the site title in the header is not a heading.
    - `skip`: the first Tab focuses a link named "Skip to main content". Pressing Enter moves focus to `#main`.
    - `announcer`: `[aria-live]` regions from NuxtRouteAnnouncer and NuxtAnnouncer exist. After client navigation `/auth/login` → `/auth/signup`, the route announcer's text contains "Signup".
    - `error-title`: `/does-not-exist` has `document.title` containing "Mango Planner" and not just "404"-only text in the h1. A message based on the status code is fine.
    - `axe-structure`: `axeScan` with rules `landmark-one-main, page-has-heading-one, region, heading-order, landmark-unique, svg-img-alt, role-img-alt, link-name` returns 0 violations on every page.
    - `info-examples`: `/info` has no `button` elements inside its `<ul>` of examples.
    - `obscured` (2.4.11): at 390 px on logged-in `/`, scrolled to the bottom, Tab through every control. For each, assert that its bounding rect doesn't intersect the sticky header's rect or the fixed "toggle utility block" button's rect.
    - `reduced-motion`: under `page.emulateMedia({ reducedMotion: 'reduce' })`, the computed style of `.page-enter-active` (or of the entering page element during navigation) has no `filter` and no transform transition. The simplest assertion: navigation completes and `getComputedStyle(main.firstElementChild).filter` is `none` within 50 ms of the route change.

- [ ] **Step 2: Run it. Expected FAIL.** At least the `h1`, `main`, `skip`, `announcer` and `info-examples` cases fail.

- [ ] **Step 3: `app.vue`.** Add `<NuxtRouteAnnouncer />` and `<NuxtAnnouncer />` inside the root template, next to `<NuxtPwaManifest />`.

- [ ] **Step 4: `default.vue`.**
  - **Skip link:** the first child of the root `div` is `<a href="#main">Skip to main content</a>` with `sr-only focus:not-sr-only` classes, and a visible style on focus (amber background, `dark-3` text, rounded, fixed at the top-left, `z-50`).
  - **Main:** wrap `<slot />` in `<main id="main" tabindex="-1" class="outline-none">`.
  - **Header title:** the `<h2>` around `menuItemData.title` becomes `<span>`, with identical classes.
  - **Logo:** remove the separate logo `<a>`. Put the `<img>` and the title inside one `NuxtLink` with `aria-label="Mango Planner home"`, keeping the current layout classes. If merging breaks the layout, keep two links and put `aria-hidden="true" tabindex="-1"` on the logo link.

- [ ] **Step 5: Headings.**
  - **Auth, about and info pages:** each page heading listed under Files goes from `<h2>` to `<h1>` with the same classes. Check that `h1` has no theme default size that changes the look; if it does, add the matching `h2-md` class.
  - **`index.vue`:** add `<h1 class="sr-only">My plans</h1>` as the first child of the `<section>`. "Create New Plan" (line 256) becomes `h2`, and the modal title becomes `h2`.
  - **`error.vue`:**
    - Use `const props = defineProps<{ error: NuxtError }>()`.
    - Show `props.error.statusCode` in the `h1` and pick the message by code: 404 → "This page doesn't exist", anything else → "Something went wrong".
    - Call `useHead({ title: \`${statusCode} | Mango Planner\` })`.

- [ ] **Step 6: `info.vue` examples.**
  - Each example `<button>` becomes a `<span>` with the same classes plus `aria-hidden="true"`. The paragraph beside it already describes it.
  - Update the "draggable" paragraph to: "Click this button to switch to custom order. Drag a plan by its handle, or tap the handle to move it up or down."

- [ ] **Step 7: Decorative SVGs.**
  - Every inline `<svg>` in `app/**/*.vue` that sits inside an element that already has a name, or is decoration only, gets `aria-hidden="true" focusable="false"`.
  - Find them with `grep -rn "<svg" app --include=*.vue`.
  - The plan-card and utility-block SVGs are touched again in Tasks 4–7; adding the attributes now is fine.

- [ ] **Step 8: Motion and scroll padding.**
  - **`page_transition.scss`:** add `@media (prefers-reduced-motion: reduce)` that keeps only the opacity transition (no `transform`, no `filter`).
  - **`index.vue` `<style>`:**
    - `.fade-*`: opacity only.
    - `.mobile-utility-*`: no transform, so it appears instantly.
    - `.loader`: `animation-duration: 6s`.
  - **`styles.css`:** `html { scroll-padding-top: 6rem; scroll-padding-bottom: 5rem; }`. Adjust the values until the `obscured` case passes.

- [ ] **Step 9: Run `check-structure.mjs` and `pnpm typecheck`.** Expected: PASS.

- [ ] **Step 10: Commit.**
  - Message: `fix(app): add landmarks, skip link, headings and route announcements`

---

### Task 4: Plan card semantics (`PlanCollapsable.vue`)

**Files:**

- Modify: `app/components/plans/PlanCollapsable.vue`
- Test: `$CHECKS/check-card.mjs`

**Interfaces:**

- Consumes:
  - `useCollapseTrigger` from `@bobbykim/manguito-theme/composable`, with signature `(collapseRef, { id, visible? }) => { attrs, isOpen, toggle }`.
- Produces:
  - Toggle button: `[data-plan-toggle="<id>"]`. Its accessible name is the plan title, and it has `aria-expanded` and `aria-controls="<id>"`.
  - Complete button: `[data-plan-complete="<id>"]`, with `aria-pressed`.
  - Delete button: named `Delete "<title>"`, and that name is already used by `lib.mjs`.
  - Task 5 adds a `move` emit and the `index` / `total` props on this component.

- [ ] **Step 1: Write `check-card.mjs`.**
  - Setup: create a work plan "Card A". Also create a plan whose title is 120 characters long; the last 10 characters are `END-MARKER`.
  - Cases:
    - `name`: `getByRole('button', { name: 'Card A', exact: true })` exists and has `aria-expanded="false"`.
    - `keyboard`: focus it, press Enter → `aria-expanded="true"` and the plan content is visible. Press Space → it collapses.
    - `complete`: `getByRole('button', { name: 'Mark "Card A" complete' })` has `aria-pressed="false"`. Clicking it gives `aria-pressed="true"`, the name becomes `Mark "Card A" incomplete`, and the card does NOT expand.
    - `icons-differ`: the complete button's SVG `innerHTML` differs between the two states.
    - `edit-delete-names`: buttons `Edit "Card A"` and `Delete "Card A"` exist once the card is open.
    - `footer-hidden`: the footer bar has `aria-hidden="true"` and contains no focusable element. Clicking it still toggles the card.
    - `axe-card`: `axeScan` rules `nested-interactive, label-content-name-mismatch, button-name, aria-allowed-attr` → 0.
    - `long-title`: the toggle's accessible name ends with `END-MARKER`, and the header has no horizontal overflow (`scrollWidth <= clientWidth`) at 390 px.

- [ ] **Step 2: Run it. Expected FAIL** on `name`, `keyboard`, `complete`, `edit-delete-names`, `footer-hidden` and `axe-card`.

- [ ] **Step 3: Header toggle.**
  - Replace the `div role="button" ... aria-label="collapse panel header"` (lines 91–98) with:
    - a header `div` that keeps the current classes but has no role, label, tabindex or click
    - inside it, `<h3 class="h3-md ...">` wrapping a `<button type="button" data-plan-toggle v-bind="attrs" @click="toggle" class="text-left w-full">` that holds the title text
  - Get `const { attrs, toggle, isOpen } = useCollapseTrigger(collapseRef, { id: item._id.toString(), visible: () => props.visible })`.
  - Use `isOpen` for the chevron rotation in place of `collapseState`. Remove `collapseState`, `toggleCollapse` and the `watch` once nothing uses them.
  - Clicking anywhere on the header outside the complete toggle should still toggle the card: keep `@click="toggle"` on the header `div` for mouse users only, and stop propagation from the button so it doesn't toggle twice.

- [ ] **Step 4: Complete toggle.**
  - It is a sibling of the toggle button, not nested inside it.
  - `type="button"`, `:aria-pressed="item.complete"`, and `:aria-label` set to `Mark "${title}" ${item.complete ? 'incomplete' : 'complete'}`.
  - **Icon:** complete → the current filled check-circle path. Incomplete → Font Awesome 6 Free regular `circle` (viewBox `0 0 512 512`, path `M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z`). Same size and colour classes.

- [ ] **Step 5: Footer bar and Edit/Delete.**
  - **Footer bar:** add `aria-hidden="true"` and remove its `aria-label`. Keep its `@click="toggle"`.
  - **Edit button:** `:aria-label="\`Edit \"${item.title}\"\`"`.
  - **Delete button:** `:aria-label="\`Delete \"${item.title}\"\`"`.
  - Remove the redundant `tabindex="0"` from both.

- [ ] **Step 6: Run `check-card.mjs`. Expected PASS.**
  - Rerun `check-contrast.mjs` too; the colours from Task 2 must still pass.
  - Run `pnpm typecheck`.

- [ ] **Step 7: Commit.**
  - Message: `fix(app/components): make plan cards keyboard and screen-reader accessible`

---

### Task 5: Move menu on the drag handle

**Files:**

- Create: `app/utils/reorderPlans.ts`
- Create: `app/components/plans/PlanMoveMenu.vue`
- Modify: `app/components/plans/PlanCollapsable.vue` (replaces the handle `<svg>`)
- Modify: `app/pages/index.vue` (the draggable slot, `movePlan`, the save guard)
- Test: `$CHECKS/check-move.mjs`

**Interfaces:**

- Produces:
  - `export type MoveTarget = 'up' | 'down' | 'top' | 'bottom'` in `app/utils/reorderPlans.ts`, auto-imported.
  - `export const reorderPlans = <T>(list: readonly T[], from: number, target: MoveTarget): T[]`, also in `app/utils/reorderPlans.ts`.
    - Returns a new array.
    - Returns an unchanged copy when the move is impossible (first item moving up or to the top, last item moving down or to the bottom).
  - `PlanMoveMenu.vue`:
    - props `{ planId: string; title: string; index: number; total: number; disabled?: boolean }`
    - emits `(e: 'move', target: MoveTarget): void`
    - The root is the handle `<button type="button" class="handle ..." :data-move-handle="planId" aria-haspopup="menu" :aria-expanded :aria-label="\`Move \"${title}\"\`">`, wrapping today's handle SVG.
  - `PlanCollapsable.vue`:
    - new optional props `index?: number`, `total?: number`
    - new emit `(e: 'move', id: string, target: MoveTarget): void`
    - It renders `PlanMoveMenu` in place of the handle SVG when `showHandle` is set.
  - `index.vue`:
    - `movePlan(id: string, target: MoveTarget): Promise<void>`
    - `isSavingOrder: Ref<boolean>`

- [ ] **Step 1: Write `check-move.mjs`.**
  - Setup: create work plans "Move 1", "Move 2" and "Move 3", then switch to custom order. The filter button is named "custom" before Task 7 and "Custom order" after it, so match `/^(custom|Custom order)$/`.
  - Read the order from the `[data-plan-toggle]` texts.
  - Cases:
    - `handle-name`: `getByRole('button', { name: 'Move "Move 2"' })` has `aria-haspopup="menu"` and `aria-expanded="false"`. Its bounding box is at least 24×24.
    - `click-opens`: clicking it opens `getByRole('menu')` with menuitems "Move up", "Move down", "Move to top" and "Move to bottom". The focused element is the first enabled item. The order is unchanged and the card did not expand.
    - `menu-visible`: every menuitem's bounding box lies inside the viewport, and `document.elementFromPoint(center)` of each item is that item or inside it, so it isn't covered by the next card.
    - `menu-keys`: ↓ moves focus to the next item. Escape closes the menu and focus returns to the handle.
    - `move-down`: open the menu on "Move 1" and activate "Move down" with Enter.
      - The order is `Move 2 | Move 1 | Move 3`, and the focused element is `[data-move-handle]` for "Move 1".
      - The NuxtAnnouncer region text is `"Move 1" moved to position 2 of 3`.
      - After reload, still in custom mode, the order persists.
    - `arrow-keys`: with the handle of "Move 3" focused, press ArrowUp. "Move 3" moves up one place without a menu, and focus stays on its handle.
    - `disabled-items`: on the first plan, "Move up" and "Move to top" have `aria-disabled="true"`. On the last plan, "Move down" and "Move to bottom" do.
    - `rapid`: focus the handle of the first plan and press ArrowDown three times with no wait. After the network goes idle and the page reloads in custom mode, the visible order equals the order shown just before the reload, and no plan is duplicated or missing.
    - `single`: delete down to one "Move" plan, plus any pre-existing plans. If the account has others, run this case on a fresh custom list containing only one plan by filtering. Otherwise, assert all four items are disabled and that ArrowUp/ArrowDown on the handle leave `page.__errors` empty.
    - `drag-still-works`: a mouse drag from handle 1 to below handle 3 reorders, and no menu opens.
    - `touch-tap`: in a `launch({ width: 390, touch: true })` context, a tap built from CDP `Input.dispatchTouchEvent` touchStart/touchEnd at the same point opens the menu.
    - `touch-drag`: in the same context, a touch drag (touchStart, 20 touchMoves over the distance, touchEnd) reorders and opens no menu.
    - `axe-move`: `axeScan` with the menu open → 0 violations.

- [ ] **Step 2: Run it. Expected FAIL** from `handle-name` onward.

- [ ] **Step 3: Implement `reorderPlans`.**
  - Before wiring it up, check it from a Node one-liner on `['a','b','c']`: index 0 'down' → `['b','a','c']`; index 2 'top' → `['c','a','b']`; index 0 'up' → `['a','b','c']`.
  - Run the one-liner through `npx tsx -e`.

- [ ] **Step 4: Implement `PlanMoveMenu.vue`.**
  - **Click and open:** a click (not a drag) toggles `open`.
  - **Rendering:** the menu is rendered with `<Teleport to="body">`, `position: fixed`, at the handle's `getBoundingClientRect()` bottom-left plus 4 px, and flipped above when there's no room below. It closes on scroll, resize, outside `pointerdown` and Escape.
  - **Menu semantics:**
    - `role="menu"`, `aria-label="Move \"<title>\""`.
    - Items are `role="menuitem"` buttons. Impossible moves get `aria-disabled="true"` rather than `disabled`, so they can still be focused.
    - ↑/↓, Home and End move focus. Enter or Space activates an item. Tab closes the menu.
  - **Items:** use the same icons as the approved mockup: chevron up/down, and arrow-to-top/bottom.
  - **Style:**
    - `bg-light-1 dark:bg-dark-3`, `rounded-md`, `shadow-lg`, `ring-1 ring-black/5`, `min-w-48`, `p-1`.
    - Rows: `flex gap-2.5 items-center w-full px-3 py-2.5 rounded text-dark-3 dark:text-light-3`.
    - Highlight: `hover:bg-warning/25 focus:bg-warning/25 focus:outline-none` (the row's background is its focus indicator).
  - **Handle keys:** keydown ArrowUp/ArrowDown on the handle (menu closed) emits `move` with 'up'/'down' and prevents page scroll.
  - **Disabled state:** when `disabled` is set, it emits nothing.
  - **Click versus drag:** the handle keeps class `handle`, so SortableJS treats it as the drag handle. A drag doesn't produce a click, so no extra logic is needed. Confirm this with `drag-still-works`.

- [ ] **Step 5: Wire it up.**
  - **`PlanCollapsable.vue`:** render `<PlanMoveMenu v-if="showHandle" :plan-id :title :index :total :disabled @move="(t) => emit('move', item._id.toString(), t)" />` where the handle SVG was.
  - **`index.vue` draggable:** use `<template #item="{ element, index }">` and pass `:index="index" :total="customOrderData.length" @move="movePlan"`. Add `:touch-start-threshold="5"` to `<draggable>`. Do not add `delay`.
  - **`movePlan(id, target)` in `index.vue`:**
    1. Return if `isSavingOrder.value`.
    2. Find `from`.
    3. `const next = reorderPlans(customOrderData.value, from, target)`, and return if the order didn't change.
    4. `customOrderData.value = next`.
    5. `await onOrderUpdate()`.
    6. `useAnnouncer().polite(\`"${title}" moved to position ${newIndex + 1} of ${next.length}\`)`.
    7. `await nextTick()`, then focus `document.querySelector(\`[data-move-handle="${id}"]\`)`. Guard this with `import.meta.client`.
  - **`onOrderUpdate`:** wrap the body in `isSavingOrder.value = true` / `try` / `finally` that sets it back to `false`.
  - **`PlanMoveMenu`'s `disabled`:** pass `isSavingOrder`.

- [ ] **Step 6: Run `check-move.mjs`. Expected PASS.**
  - Then rerun `check-card.mjs`, `check-contrast.mjs` and `pnpm typecheck`.

- [ ] **Step 7: Commit.**
  - Message: `feat(app/components): add keyboard and tap reordering via the drag handle`

---

### Task 6: Dialogs, sidebar, accordions and toggles

**Files:**

- Modify: `app/pages/index.vue` (Modal header `titleId`, remove `@keyup.esc` at line 232, focus target after the mobile-block modal)
- Modify: `app/layouts/default.vue` (Sidebar `aria-label`)
- Modify: `app/components/layout/AuthBlock.vue`
- Modify: `app/components/widget/UserInfoWidget.vue`
- Modify: `app/components/widget/DarkmodeWidget.vue`
- Modify: `app/components/plans/MobileUtilityToggleButton.vue`
- Modify: `app/components/plans/MobileUtilityBlock.vue` (root `id`)
- Test: `$CHECKS/check-dialogs.mjs`

**Interfaces:**

- Consumes:
  - Modal and Sidebar `#header` slot props `{ close, status, titleId }`.
  - The new `ariaLabel` prop on Sidebar.
  - `useCollapseTrigger`.
- Produces:
  - DarkmodeWidget is `getByRole('switch', { name: 'Dark mode' })`. `lib.mjs`'s `setDark` uses it.
  - MobileUtilityBlock's root has `id="mobile-utility"`.

- [ ] **Step 1: Write `check-dialogs.mjs`.**
  - Cases:
    - `modal-name`: open the edit modal on a test plan. `getByRole('dialog', { name: 'Update Plan' })` is visible.
    - `modal-esc`: Escape closes it, and focus is on the plan's `Edit "<title>"` button.
    - `sidebar-name`: click the username button, which has `aria-haspopup="dialog"`. `getByRole('dialog', { name: 'My account' })` is visible.
    - `sidebar-esc`: Escape closes it, and focus returns to the username button.
    - `accordion`: in the sidebar, "Update Username", "Update Profile Picture" and "Update Password" each have `aria-expanded` and an `aria-controls` that resolves to an existing element. Opening one sets it to `true` and the others to `false`.
    - `no-role-submit`: no element in the document has `role="submit"`.
    - `pw-autocomplete`: `#current-pw` has `autocomplete="current-password"` and `#new-pw` has `autocomplete="new-password"`.
    - `dark-switch`: `getByRole('switch', { name: 'Dark mode' })` is reachable by Tab inside the sidebar. Space toggles `aria-checked` and the `html.dark` class. Toggle it back.
    - `mobile-toggle`: at 390 px, the "toggle utility block" button has `aria-expanded="false"` and `aria-controls="mobile-utility"`. After a click it's `"true"`.
    - `mobile-modal-focus`: at 390 px, open the utility block, activate its "new" button, then press Escape. The focused element is visible (`offsetParent !== null`) and is the "toggle utility block" button.
    - `axe-dialogs`: `axeScan` with each dialog open → 0 violations for `aria-dialog-name, aria-allowed-attr, aria-valid-attr-value, aria-roles`.

- [ ] **Step 2: Run it. Expected FAIL** on most cases.

- [ ] **Step 3: Modal (`index.vue`).**
  - Header slot: `#header="{ close, titleId }"`. The title heading gets `:id="titleId"`.
  - Remove `@keyup.esc` from the grid `div`. Make sure `onClear` still runs on Escape; the `<Modal @close="onClear">` already covers it.
  - **`openModal` called from the mobile block:** record `returnFocusTo = 'mobile-toggle'`. On Modal `@close`, if it's set, `nextTick` then focus `[aria-controls="mobile-utility"]`. This button stays visible, so it's a sensible target.

- [ ] **Step 4: Sidebar (`default.vue`).**
  - Add `aria-label="My account"` to `<Sidebar>`.
  - Remove the redundant `aria-label` mismatch, if any, on the close button; keep "close sidebar".

- [ ] **Step 5: `AuthBlock.vue`.** The username button gets `type="button" aria-haspopup="dialog"`.

- [ ] **Step 6: `UserInfoWidget.vue`.**
  - For each of the three accordions, call `const { attrs: usernameAttrs, toggle: toggleUsername } = useCollapseTrigger(usernameCollapseRef, { id: 'update-username' })`, and likewise for picture and password.
  - Bind `v-bind="usernameAttrs" @click="toggleUsername"` on each button.
  - Replace the three `role="submit"` buttons with `type="submit"`.
  - Add `autocomplete` to the inputs: `#user-name` → `username`, `#current-pw` → `current-password`, `#new-pw` → `new-password`.

- [ ] **Step 7: `DarkmodeWidget.vue`.**
  - The inner `div role="button"` becomes `<button type="button" role="switch" :aria-checked="dark" aria-label="Dark mode" @click=...>`, with the same classes plus `w-full`.
  - It inherits the focus ring from the theme's `focus-visible` styles. If `focusRing` reports no ring, add `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning`.

- [ ] **Step 8: `MobileUtilityToggleButton.vue` and `MobileUtilityBlock.vue`.**
  - **Toggle button:** add `:aria-expanded="open" aria-controls="mobile-utility"`, and change the label to "Show tools" when closed and "Hide tools" when open.
  - **`MobileUtilityBlock` root:** `id="mobile-utility"`.
  - **Check:** the `mobile-toggle` case expects the name to be either label.

- [ ] **Step 9: Run `check-dialogs.mjs`. Expected PASS.**
  - Rerun `check-structure.mjs` and `pnpm typecheck`.

- [ ] **Step 10: Commit.**
  - Message: `fix(app): name dialogs and expose toggle state to assistive tech`

---

### Task 7: Search, filters, live updates, loading, drafts, focus after delete

**Files:**

- Modify: `app/components/plans/UtilityBlock.vue`
- Modify: `app/components/plans/MobileUtilityBlock.vue`
- Modify: `app/components/plans/DraftsBlock.vue`
- Modify: `app/pages/index.vue` (pass `displayStyle` down, count announcement, regex escaping in `getPlans`, spinner, focus after delete)
- Test: `$CHECKS/check-utility.mjs`

**Interfaces:**

- Consumes: `useAnnouncer` (Task 3), `[data-plan-toggle]` (Task 4).
- Produces: both utility blocks take the new prop `active: 'all' | 'incomplete' | 'custom' | 'search'`.

- [ ] **Step 1: Write `check-utility.mjs`.**
  - Setup: create work plans "Util alpha", "Util beta" and "Util (paren)".
  - Cases:
    - `filter-names`: buttons named "Show all plans", "Show incomplete plans" and "Custom order" exist in the desktop block. Exactly one has `aria-pressed="true"`, and clicking another moves the `true` to it.
    - `search-label`: `getByRole('textbox', { name: 'Search plans' })` exists. The search `<label>` has no `tabindex`.
    - `count-announce`: type "Util" into the search box. Within 1500 ms, the NuxtAnnouncer text matches `/^\d+ plans? shown$/`, and the number equals the count of `[data-plan-toggle]` elements.
    - `regex`: type `(` into the search box. `page.__errors` stays empty, and the announcement matches `/^\d+ plans? shown$/`.
    - `spinner`: on a hard reload of `/`, `getByRole('status')` contains "Loading plans" before the list mounts. Poll from `domcontentloaded`. If the spinner is too quick to catch, assert from the server HTML instead: `await (await fetch('/')).text()` contains `role="status"`.
    - `drafts`: seed a draft through the app's IndexedDB key used by `planStore` (find it in `app/stores`). Draft buttons are named "New draft" or `Edit draft "<title>"`, and `focusRing` reports `visible: true`. If seeding a draft isn't practical, assert from the source: `btn-no-ring` no longer appears in `DraftsBlock.vue`.
    - `delete-focus`: delete "Util alpha" through its `Delete` button. The focused element is the next plan's `[data-plan-toggle]`.
    - `delete-last`: in a search that leaves exactly one plan, delete it. The focused element is the `h1` (`My plans`), which therefore needs `tabindex="-1"`.
    - `axe-utility`: `axeScan` → 0 violations on `/` with the search active.

- [ ] **Step 2: Run it. Expected FAIL.**

- [ ] **Step 3: Utility blocks.**
  - **Filter buttons**, in both `UtilityBlock.vue` and `MobileUtilityBlock.vue`:
    - `aria-label` and `title` become "Show all plans", "Show incomplete plans" and "Custom order".
    - `:aria-pressed="active === 'all'"` and the equivalents for the other two.
    - `type="button"`.
  - **Search label:** remove `tabindex="0"` and add `<span class="sr-only">Search plans</span>` inside it.
  - **Mobile "new" button:** `aria-label="New plan"`.
  - **`index.vue`:** pass `:active="displayStyle"` to both blocks.

- [ ] **Step 4: `index.vue` live updates and loading.**
  - **Regex escaping:** in `getPlans`, escape `searchTerm` before `new RegExp`: `searchTerm.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.
  - **Count announcement:** a `watch(() => [displayStyle.value, searchTerm.value], ...)` debounced by 500 ms (use `useDebounceFn` from `@vueuse/core`) calls `useAnnouncer().polite(\`${n} ${n === 1 ? 'plan' : 'plans'} shown\`)`. Here `n`is the length of`customOrderData`in custom mode, or of`getPlans` otherwise.
  - **Spinner wrapper `div`:** `role="status"`, containing `<span class="sr-only">Loading plans</span>`.

- [ ] **Step 5: Focus after delete.**
  - In `handleCollapseDelete`, before deleting, record the ids of the next and previous visible plans (in DOM order of `[data-plan-toggle]`).
  - After deleting, `await nextTick()` and focus the next plan's toggle if it still exists, else the previous one's, else `h1` (`tabindex="-1"`).
  - Guard this with `import.meta.client`.

- [ ] **Step 6: `DraftsBlock.vue`.**
  - Remove `btn-no-ring`.
  - Add `type="button"` and `:aria-label="draft.id === 'new' ? 'New draft' : \`Edit draft \"${draft.data.title}\"\`"`.

- [ ] **Step 7: Run `check-utility.mjs`. Expected PASS.**
  - Rerun `check-card.mjs` and `check-move.mjs`; the custom-order button name changed, which their setup already tolerates.
  - Run `pnpm typecheck`.

- [ ] **Step 8: Commit.**
  - Message: `fix(app): announce search results and keep focus after deletes`

---

### Task 8: Forms

**Files:**

- Modify: `app/pages/auth/login.vue`
- Modify: `app/pages/auth/signup.vue`
- Modify: `app/pages/auth/request.vue`
- Modify: `app/pages/auth/reset-password.vue`
- Modify: `app/components/plans/PlanInputForm.vue`
- Modify: every `<button role="button">` in `app/**` (`grep -rn 'role="button"' app`)
- Test: `$CHECKS/check-forms.mjs`

**Interfaces:**

- Consumes:
  - `MclInputText`'s `autocomplete` prop.
  - `MclFormGroup`'s `help-text` prop. The library wires `aria-describedby` for it.

- [ ] **Step 1: Write `check-forms.mjs`.**
  - Cases:
    - `autocomplete`: the `autocomplete` attribute on each field:

      | Page                   | Field          | Value              |
      | ---------------------- | -------------- | ------------------ |
      | `/auth/login`          | `#email`       | `email`            |
      | `/auth/login`          | `#password`    | `current-password` |
      | `/auth/signup`         | `#user-name`   | `username`         |
      | `/auth/signup`         | `#email`       | `email`            |
      | `/auth/signup`         | `#password`    | `new-password`     |
      | `/auth/request`        | email field    | `email`            |
      | `/auth/reset-password` | password field | `new-password`     |

    - `signup-form`: on `/auth/signup`, `#user-name` is inside the `<form>`. Pressing Enter in `#user-name` with every field empty triggers native validation, so `form.checkValidity()` is false and no request is sent.
    - `pw-help`: on `/auth/signup` and `/auth/reset-password`, before any typing, the password input's `aria-describedby` points at an element whose text contains "at least 8 characters".
    - `radio-group`: on logged-in `/`, the desktop form's type radios are inside a `fieldset` whose `legend` text is "Plan type". The legend may be visually hidden.
    - `no-role-button`: `document.querySelectorAll('button[role="button"]').length === 0` on every page in the audit list.
    - `axe-forms`: `axeScan` → 0 violations on all four auth pages.

  - Reset-password needs a token in its URL. Open it with any dummy token; only the DOM is checked.

- [ ] **Step 2: Run it. Expected FAIL.**

- [ ] **Step 3: Auth pages.**
  - Add the `autocomplete` values from the table.
  - **`signup.vue`:** move the username `MclFormGroup` inside the `<form>`, before the email field.
  - **`signup.vue` and `reset-password.vue`:** add `help-text="Use at least 8 characters, with an uppercase and a lowercase letter, a number and a special character."` to the password `MclFormGroup`. Keep `invalid-feedback` for the error state.
  - Remove `role="button"` from every submit button.

- [ ] **Step 4: `PlanInputForm.vue`.** Wrap the radios' `div` (line 111) in `<fieldset><legend class="sr-only">Plan type</legend>...</fieldset>`, keeping the inner layout classes on the existing `div`.

- [ ] **Step 5: Remaining `role="button"` on real buttons.**
  - Remove it app-wide, including `PlanInputForm.vue:136`.
  - Also remove any `tabindex="0"` on native buttons or links.

- [ ] **Step 6: Run `check-forms.mjs`. Expected PASS.** Then run `pnpm typecheck`.

- [ ] **Step 7: Commit.**
  - Message: `fix(app): add autocomplete, password help and grouped radios to forms`

---

### Task 9: Full verification and PR

**Files:**

- No new code, unless a check finds something.
- Test: `$CHECKS/audit.mjs`, `$CHECKS/check-keyboard.mjs`

- [ ] **Step 1: Write `check-keyboard.mjs`.** Use only `page.keyboard`, apart from typing the credentials. Cases:
  - `focus-visible`: on every page in the audit list, logged in and logged out, at 1280 px and 390 px, Tab through every control until focus cycles. `focusRing(page).visible` must be true for each control. Print any that fail with their description.
  - `flow`: go through each flow with the keyboard only:
    1. Log in.
    2. Create a work plan.
    3. Open it.
    4. Edit its title in the modal, submit, and confirm.
    5. Mark it complete.
    6. Switch to custom order and move it with the menu and with ↑/↓.
    7. Search for it.
    8. Open the sidebar, open "Update Password", and close it with Escape.
    9. Toggle dark mode on and off.
    10. Delete the plan.

    After each step, assert the visible result, and that `page.__errors` has nothing new apart from the known hydration warning on `/` (#18).

- [ ] **Step 2: Run everything.**
  - `node audit.mjs`, `node check-keyboard.mjs`, and every `check-*.mjs` from Tasks 2–8.
  - Expected: all exit 0. `audit.mjs` reports 0 violations across all states.
  - Fix anything that fails in the task's own files, rerun, and commit with that task's scope.

- [ ] **Step 3: Build.**
  - Run `pnpm typecheck && pnpm build:local`.
  - Expected: success, with no new warnings beyond Vite's `PLUGIN_TIMINGS`.

- [ ] **Step 4: Screenshots for the PR.**
  - Capture light-mode `/auth/login`, and `/` with work, chore and personal cards (one expanded).
  - Capture the Move menu open, at 1280 px and at 390 px.
  - Capture dark-mode `/`.
  - Save them in `$CHECKS/shots/`, not in the repo.

- [ ] **Step 5: Ask the user to test on a real phone.**
  - Things to try: tapping the handle opens the menu, dragging the handle still reorders, and nothing else feels different.
  - Wait for their result before opening the PR, and fix anything they report.

- [ ] **Step 6: Push and open the PR.**
  - `git push -u origin feat/accessibility`
  - `gh pr create --base master` with title `fix(app): accessibility pass (WCAG 2.2 AA)` and a body that contains:
    - "Closes #17"
    - before and after axe counts, from `baseline.txt` and the final audit
    - the agreed visible changes
    - the builder's calls from the spec's "Visible changes" list:
      - outline icon for incomplete plans
      - dark success-alert text
      - dark search icon
      - footer social icons now `#735107` in light mode (they come from MCL `text-warning`)
      - skip link
      - password help text
    - how it was verified
  - End the body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
