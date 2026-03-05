# Mango Planner v2

A repository for source code of [Mango Planner v2](https://mango-planner.vercel.app/) project. Reworked original [Mango Planner](https://github.com/bobbykim89/mango-planner) using Nuxt 3.

## Setup

Install dependencies:

```bash
## pnpm
pnpm install
```

## Dev server

Start dev server on port 3000

```bash
## pnpm
pnpm dev
```

## Production

Build application for production

```bash
## pnpm
pnpm build
pnpm preview ## locally preview production build
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Features

### Core Features

- **TODO Management** — Full CRUD operations for managing todo items
- **User Profile** — Set and update user profile picture and personal information
- **Authentication** — Secure login with password reset via verification email
- **Dark / Light Mode** — Toggle between dark and light themes
- **Weather Widget** — Real-time weather information display

### New Features

- **Draft Recovery** — Automatically saves drafts to IndexedDB when a create or update operation fails, ensuring no work is lost
- **Markdown Support** — Todo items support full Markdown rendering including:
  - Headings, lists, blockquotes, tables, and code blocks
  - Inline and block math equations via KaTeX (`$...$` and `$$...$$`)

## Tech stack

> Vue
> Nuxt 4
> Nitro (H3)
> MongoDB
> Mongoose
> TailwindCSS 4
> VueUse
> Bcrypt
> marked
> KaTeX
> Manguito Component Library (MCL)
