# SOPet Vendor Panel

Vendor-facing web app for SOPet marketplace operations.

Built with Vite + React on top of Medusa dashboard extension tooling.

## What This App Covers

- Vendor authentication and profile
- Product management (create/edit/media/attributes)
- Orders and fulfillment workflows
- Pricing, inventory, shipping profiles, sales channels
- Reviews, requests, campaigns, and store settings

## Stack

- Vite `5`
- React `18`
- TypeScript
- Medusa admin/dashboard packages
- React Query + React Router

## Quick Start

1. Install dependencies:

```bash
yarn install
```

2. Create local env file:

```bash
cp .env.template .env.local
```

3. Configure `.env.local`:

```env
VITE_MEDUSA_BASE=/
VITE_MEDUSA_STOREFRONT_URL=http://localhost:3000
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_DISABLE_SELLERS_REGISTRATION=false
```

4. Start vendor app:

```bash
yarn dev
```

## Scripts

- `yarn dev`: start Vite dev server
- `yarn build`: build app package and generate types
- `yarn build:preview`: build preview bundle
- `yarn preview`: serve preview build
- `yarn build:admin`: medusa build
- `yarn test`: run vitest
- `yarn lint`: run eslint
- `yarn typecheck`: run TypeScript checks
- `yarn format`: format project files
- `yarn format:check`: check formatting
- `yarn i18n:validate`: validate translation files
- `yarn i18n:schema`: generate i18n schema

## Environment Variables

Primary env template: `.env.template`

Technical reference:

- `docs/technical/environment-variables.md`

## Deployment

Deployment is triggered by GitHub Actions workflow:

- `.github/workflows/deploy.yml`

Branch mapping:

- `main` -> Vercel production deploy hook
- `uat` -> Vercel UAT deploy hook

SPA rewrite is configured in `vercel.json`.

## Technical Documentation

- Docs index: `docs/technical/README.md`
- Architecture: `docs/technical/architecture.md`
- Env vars: `docs/technical/environment-variables.md`
- Deployment: `docs/technical/deployment.md`
- Operations: `docs/technical/operations.md`

## Repository Structure

```txt
src/routes/             Feature routes (products, orders, store, etc.)
src/providers/          App providers and router setup
src/hooks/api/          API hooks by domain
src/lib/                Client and utility modules
src/extensions/         Dashboard extension manager and APIs
src/components/         Shared UI and table components
scripts/                Build and i18n helper scripts
```
