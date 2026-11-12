# Accessibility pass (#17): design

## Why

There is no specific incident behind this. Accessibility is simply worth getting right while the app is being hardened. An audit on 2026-11-11 found that keyboard and screen-reader users can't use core features. The audit used axe-core 4.14 with the WCAG 2.2 AA rule tags plus best practices, run in light and dark mode, logged out and logged in, at desktop and 390 px widths. It also included keyboard walks and a code review of every `.vue` file. The worst findings:

- A plan can't be opened from the keyboard, so its content and its Edit/Delete buttons are out of reach.
- The dark mode toggle can't be reached.
- Reordering is drag-only.
- Escape doesn't close dialogs.
- Several controls have no visible focus.
- Every plan is announced as "collapse panel header".
- Mango amber text on light grey has a contrast of 1.6:1.

The library-side findings were fixed upstream in manguito-component-library#110 and #111, and released in `@bobbykim/manguito-theme` 1.5.0, `@bobbykim/mcl-footer` 0.10.8 and `@bobbykim/mcl-forms` 0.12.4. This work covers the app side.

## Goals

- Meet WCAG 2.2 AA across all pages and states: guest pages, the logged-in plan list, an expanded plan, the edit modal, the user sidebar, mobile layout, light and dark mode.
- Every feature is usable with the keyboard alone, and with a screen reader, with sensible names, roles, states and announcements.
- The app looks the same as today, except for the changes listed under "Visible changes".

## Non-goals

- The login redirect and hydration mismatch on `/`. Both are #18, and the hydration warning is a known existing issue.
- API, store or Pinia refactors. Those are #19 and #20.
- Setting up Vitest or committing an automated a11y test suite. Vitest is planned separately, so verification here uses throwaway scripts.
- Library changes. If a new library gap turns up, raise an issue on bobbykim89/manguito-component-library for the user to fix rather than working around it in the app, unless a workaround is trivial and local.
- Upgrading other dependencies. The only bumps are the three MCL packages above.

## Anti-goals (a failure even if axe passes)

- Changing the look beyond the agreed visible changes. Examples: restyling cards, moving controls, darkening amber buttons, backgrounds or borders, or touching card tints other than the light-mode work and chore headers in decision 3.
- Making dragging worse. Drag-to-reorder must feel exactly as it does now.
- New hydration warnings or SSR errors. Guard browser-only code with `import.meta.client`, following the existing pattern.
- Taking title space away from the plan card.

## Constraints

- Follow CLAUDE.md conventions: Prettier style, strict TypeScript, thin components where practical, and no reading `.env*`.
- Work on branch `feat/accessibility` and open one PR that closes #17. Use Conventional Commits with a scope, and group commits by area.
- pnpm 12 `minimumReleaseAge`: the new MCL versions were released today. Add them to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`, as was done for earlier MCL releases.
- Verify with `pnpm typecheck`, `pnpm build:local`, and browser checks against `pnpm dev` (`.env.local` DB).
- **Test account:** `claude-test+mcl@example.com` exists in that DB.
  - Its password is deliberately kept out of the repo. Get it from the person running the work. Don't commit it, and don't put it in the PR.
  - There is no delete-account endpoint, so the account itself stays.
  - Delete every plan you create while testing.
- **Test data:** must include all three plan types (personal, work, chore), each with Markdown content containing a link and inline code. Each type has its own tint, so contrast must be checked on every one.

## Decisions made with the user

### 1. Amber text colour in light mode: `#735107`

- **What changes:** in light mode only, amber used as _text_ changes to `#735107`. That covers:
  - the site title
  - page headings
  - the "Sign up" and "Here" links on login
  - the sidebar username
  - links and inline code inside plan Markdown
  - the footer title
- **What stays `#f1ac18`:** buttons, backgrounds, borders, radios, spinners, focus rings and the whole of dark mode.
- **Why:** the user picked this from side-by-side screenshots over `#865e09` and a "dark text + amber underline" variant. It reaches at least 5:1 on light-2 (`#f1f1f1`), light-3 (`#e8e8e8`) and the open-plan panel (about `#d6d6d6`).
- **Left to the builder:** how to implement it, for example a light-mode override of the amber text colour in `app/assets/css/styles.css`, or a dedicated text token. The only requirement is that amber backgrounds, borders and outlines don't change.

### 2. Keyboard and non-drag reordering: the drag handle doubles as a "Move" menu button (option C)

The user picked this from mockups over stacked ▲▼ arrows and over two buttons on the right side of the card. This option adds no visible controls and costs no title space.

- **Where:** custom sort mode only, wherever the handle shows today (`PlanCollapsable` with `showHandle`).
- **The handle element:**
  - It becomes a real `<button type="button">` that wraps the existing handle icon.
  - Accessible name: `Move "<plan title>"`.
  - `aria-haspopup="menu"` and `aria-expanded`.
  - Its hit area is at least 24×24 px with no visual change, using padding or negative margin.
  - It keeps the `.handle` class so vuedraggable still uses it as the drag handle.
- **Pointer:**
  - Dragging works as now.
  - A plain click or tap with no movement opens a small menu below the handle with Move up, Move down, Move to top and Move to bottom.
  - Items that make no sense are disabled: Up and Top on the first plan, Down and Bottom on the last.
  - Add a small movement tolerance of about 5 px (Sortable's `touchStartThreshold` / `fallbackTolerance` or equivalent), so a shaky tap isn't read as a drag.
  - Don't add a press-and-hold delay; drag must feel the same as now.
- **Menu behaviour:**
  - Uses the menu-button pattern, with `role="menu"` and `menuitem`s.
  - When it opens, focus goes to the first enabled item, and ↑/↓ move between items.
  - Enter or Space activates an item. Escape or a click outside closes the menu and returns focus to the handle.
  - It must not be clipped by the card. The card root has `overflow-hidden`, and the `drop-shadow` filter creates a stacking context, so the menu must render above neighbouring cards. Teleporting it, or lifting the open card's stacking, are both fine.
  - Style: a light surface (`#fafafa`), rounded corners, a soft shadow, full-width rows about 40 px tall, small chevron or "to-end" icons, and an amber-tinted hover/active row. The dark-mode equivalent uses the dark palette.
- **Keyboard shortcut:** with the handle focused, ↑/↓ move the plan one place directly, without opening the menu.
- **After a move:**
  - The new order is saved through the same path drag uses (`onOrderUpdate` in `index.vue`).
  - Focus stays on, or returns to, that plan's handle at its new position.
  - A polite live region announces `"<title>" moved to position N of M`.
- **Already confirmed:** in the current app, a click on the handle reaches a click listener without starting a drag or opening the card. A real drag still reorders and fires no click. Both were checked with a mouse and with emulated touch (CDP touch events).
- **Still to check:** the user will try it on a real phone once it's built.

### 3. Work and chore card tints in light mode: paler tints with dark text (option B)

The first amber comparison only covered personal plans. Measured on real work and chore cards in light mode:

| Element                                                    | Contrast        |
| ---------------------------------------------------------- | --------------- |
| Dark title on the `bg-info/60` and `bg-primary/60` headers | 3.5:1 and 3.1:1 |
| Type label (`text-xs opacity-60`)                          | about 2.5:1     |
| `#735107` links on the `/25` panels                        | about 3.1–3.3:1 |

No text colour fixes the chore header at today's tint, because black gets 4.49:1. The user picked option B from screenshots, over a solid-tint variant that matched dark mode. The changes, all in light mode only:

- **Headers and footer bars:** the work and chore tints go from 60% to 40% (`bg-info/40`, `bg-primary/40` or equivalent). Text stays `dark-3`, which gives the titles about 5.1:1 (work) and 4.8:1 (chore).
- **Open panels:** they keep their current `/25` tint.
- **Type label** ("personal" / "work" / "chore"): drop `opacity-60` and use full `dark-3` on all three types.
- **Links inside Markdown on work and chore panels:** `dark-3` text with a 2 px `#f1ac18` underline, since no amber passes on those tints. Links on personal panels keep `#735107`. Inline code keeps its light chip with `#735107` text, which passes everywhere.
- **Dark mode:** card tints and text are unchanged. The type label also drops `opacity-60` there, because it fails at about 3.7–4.4:1 on the solid work and chore headers.

## Scope: what to fix

These come from the audit. File references point to the current `master`.

### A. Library bump and wiring

- Bump these packages and add the `minimumReleaseAgeExclude` entries:
  - `@bobbykim/manguito-theme` to ^1.5.0
  - `@bobbykim/mcl-footer` to ^0.10.8
  - `@bobbykim/mcl-forms` to ^0.12.4
- Modal (`index.vue` ~360) and Sidebar (`default.vue` ~371) both use custom `#header` slots. Put the slot's `titleId` on the custom heading, so each dialog is named by its visible title.
- The library now handles Escape and returns focus itself. Remove the dead `@keyup.esc` on the grid div (`index.vue` ~232) if nothing else needs it.
- Use `useCollapseTrigger` (from `@bobbykim/manguito-theme/composable`) for the plan card toggle and the three UserInfoWidget accordion buttons, so they get `aria-expanded` and `aria-controls`.
- The mobile utility toggle (`MobileUtilityToggleButton.vue`) needs `aria-expanded` too.
- The username button that opens the sidebar (`AuthBlock.vue`) gets `aria-haspopup="dialog"`.
- Remove the non-interactive click target on the username `<p>`, if one is left after this change.

### B. Plan card (`PlanCollapsable.vue`)

- **Header toggle:** replace the `div role="button" aria-label="collapse panel header"` with a real `<button type="button">` that holds the title, so the plan's name is its accessible name. Keep the `h3` as a heading around or beside it, and keep the look identical.
- **Complete toggle:** move it out of the toggle button; today it is nested, and nesting interactive elements is invalid. Give it:
  - `aria-pressed`
  - the name `Mark "<title>" complete` / `Mark "<title>" incomplete`
  - a non-colour cue (see "Visible changes")
- **Footer chevron bar:** it duplicates the header toggle, so keep it mouse-clickable but hide it from assistive tech (`aria-hidden="true"`, not focusable).
- **Edit / Delete:** name them `Edit "<title>"` / `Delete "<title>"`.
- **Handle:** see decision 2.

### C. Global structure

- **`default.vue`:**
  - Wrap the page `<slot />` in `<main id="main">`.
  - Add a skip link ("Skip to main content") as the first focusable element, visually hidden until focused.
- **Headings:** every page has exactly one `h1`, with a logical order below it. Promote the existing page headings and keep their current classes, so nothing looks different:
  - Login, Signup, Request and Reset each promote their `h2`.
  - About, Info and the error page get an `h1` the same way.
  - The plan list (`index.vue`) needs an `h1` too. A visually hidden one is fine if no visible heading fits.
  - The header site title stops being a heading.
- **Route changes:** add `<NuxtRouteAnnouncer />` to `app.vue`.
- **`error.vue`:** give it a `useHead` title, and stop showing "404" for every error.
- **Decorative inline SVGs** across the app get `aria-hidden="true" focusable="false"`.
- **Logo link** (`default.vue` ~192): name it "Mango Planner home". The adjacent title link goes to the same place, so collapse the two into one link or hide one from assistive tech.

### D. Focus visibility and management

- Every interactive element shows a visible focus indicator. The audit found none on:
  - the Submit/Save buttons
  - the filter buttons, which the library fixed in 1.5.0
  - the sidebar's custom close button
  - the draft "Edit" button (`btn-no-ring`, `DraftsBlock.vue` ~32)
  - the footer nav links

  Recheck all of these after the bump.

- **Focus restore:**
  - After deleting a plan, move focus to the next plan's toggle (or the previous one, or the list heading when the list is empty) rather than leaving it on a removed node.
  - When the modal opens from the mobile utility block, that block is hidden first, so focus would return to a hidden button. Make it return to a visible, sensible element.
- **Sticky or fixed overlays** (the sticky header, the mobile utility block) must not cover the focused element (2.4.11). Use `scroll-padding-top` or an equivalent.

### E. Search, filters and live updates (`UtilityBlock.vue`, `MobileUtilityBlock.vue`)

- **Filter buttons:**
  - Names: "Show all plans", "Show incomplete plans", "Custom order".
  - Mark the active one with `aria-pressed`.
- **Search input:**
  - Its label gets visually hidden text, "Search plans".
  - Remove `tabindex="0"` from the label.
- **Live region:** a polite live region announces the visible plan count when the search or filter changes, for example "3 plans shown". Debounce it so typing doesn't spam announcements.
- **Loading spinner** (`index.vue` ~355): `role="status"` with visually hidden "Loading plans" text.
- **Reorder announcements:** one shared live region is fine, used for both the count and the reorder messages from decision 2.

### F. Forms

- Add `autocomplete` everywhere it applies (`MclInputText` accepts the prop):
  - login: `email`, `current-password`
  - signup: `username`, `email`, `new-password`
  - reset password: `new-password`
  - user sidebar password change: `current-password` / `new-password`
- **`signup.vue`:** the username field sits outside the `<form>`. Move it inside, so Enter submits and `required` applies.
- **Plan type radios** (`PlanInputForm.vue` ~111): group them in a fieldset with a legend. `MclFormGroup` supports `group-label`; check its current API.
- **UserInfoWidget:**
  - Remove the invalid `role="submit"`.
  - Remove redundant `role="button"` and `tabindex="0"` from real buttons, app-wide.
- **Password rules:** show them as help text before the first attempt (signup, reset), wired up with `aria-describedby`, rather than only after a failure.

### G. Other

- **`DarkmodeWidget.vue`:** today it's a `div role="button"` that keyboard users can't reach. Make it a `<button type="button" role="switch" aria-checked>` with the name "Dark mode".
- **`info.vue` (~38–128):** the example buttons do nothing, and their names don't match the real controls. Make them non-interactive illustrations, either `role="img"` with a descriptive label or hidden from assistive tech with a text description.
- **Reduced motion:** respect `prefers-reduced-motion` for the app's own transitions: `page_transition.scss` (slide plus blur), the list transitions and the spinner in `index.vue`.
- **Other contrast failures from the audit:**
  - Success alert text: `#fafafa` on `#78be20` is 2.19:1.
  - The plan type label: see decision 3.
  - The white search icon on the amber block is about 1.9:1.
  - Fix these with minimal visual change. See "Visible changes".

## Visible changes

The user agreed to:

- amber text `#735107` in light mode
- the handle Move menu
- paler work and chore tints in light mode, with full-opacity type labels and underlined dark links on those panels

These are the builder's calls, kept small. Point them out in the PR:

- **Complete toggle icon:** keep the current filled check-circle for complete. Incomplete becomes an outlined circle, so state isn't shown by colour alone. Same size and colours.
- **Success alert text:** dark (`dark-3`) instead of white on the green background. Leave the other alert colours unless they also fail.
- **Search icon on the amber block:** dark instead of white.
- **Skip link:** visible only when focused.

## Verification

- `pnpm typecheck` and `pnpm build:local` pass.
- **axe** (throwaway Playwright script against `pnpm dev`, WCAG 2.2 AA plus best-practice tags) shows no violations in any of these states:
  - guest pages: login, signup, request, about, info, a 404 page
  - logged in: list, expanded plan, edit modal, sidebar with a panel open, custom mode with the Move menu open
  - light and dark mode
  - 1280 px and 390 px widths

  Ignore findings inside Nuxt devtools.

- **Logged-in dark mode:** in the audit, the colour mode flipped back to light after logging in, so logged-in pages were never scanned in dark. Make sure they are scanned in dark mode, and if that flip is a bug, note it for a separate issue rather than fixing it here.
- **Keyboard walk:** every control can be reached in a sensible order with a visible focus indicator, and these flows work with the keyboard alone:
  - log in
  - create a plan
  - open, edit, complete and delete a plan
  - reorder with the Move menu and with ↑/↓
  - search and filter
  - open the sidebar, use its panels and close it with Escape
  - toggle dark mode
- **Accessibility tree:** check names and states with the accessibility tree, for example Playwright `ariaSnapshot`:
  - plan toggle name = title, with `aria-expanded`
  - complete toggle with `aria-pressed`
  - dialogs named
  - one `h1` per page
- **Mouse drag-to-reorder** still works and saves the order.
- **Hydration:** no new hydration or console warnings beyond the known `/` mismatch from #18.
- **Real phone:** the user tests the Move menu tap and the drag on an actual device before merge.

## Left to the builder

- How the amber override is implemented, and how the menu is positioned (teleport or stacking).
- Whether the Move menu becomes a small reusable component or composable. It probably should, since both the menu and the live-region announcer are generic.
- Exact visually-hidden text and the h1 wording on the plan list.
- How to split the work into commits.
