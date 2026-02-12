# Vendor Panel Architecture

## High-Level Overview

The vendor panel is a Vite + React single-page app that provides seller operations for the SOPet marketplace.

- Runtime: SPA
- Build tool: Vite
- Data layer: Medusa SDK + domain API hooks
- Extension model: Medusa dashboard virtual modules

## Runtime Flow

1. `src/main.tsx` mounts app root.
2. `src/app.tsx` initializes `DashboardExtensionManager`.
3. Providers initialize query, i18n, theme, extension context.
4. Router provider mounts route map with `__BASE__`.
5. Route features under `src/routes/**` handle seller workflows.

## Build-Time Env Injection

`vite.config.mts` maps env variables to globals:

- `__BASE__`
- `__BACKEND_URL__`
- `__STOREFRONT_URL__`
- `__PUBLISHABLE_API_KEY__`
- `__TALK_JS_APP_ID__`
- `__DISABLE_SELLERS_REGISTRATION__`

These values are consumed in runtime modules such as:

- `src/lib/client/client.ts`
- `src/lib/storefront.ts`
- `src/providers/router-provider/router-provider.tsx`

## Domain Structure

Feature routes are organized under `src/routes` by business domain.

Major route areas include:

- products
- orders
- store
- reviews
- customers/customer-groups
- campaigns/promotions
- inventory
- regions/tax-regions
- settings/profile

Scale snapshot:

- `546` route `.tsx` files under `src/routes`

## Core Layers

- `src/routes`: feature pages and domain forms
- `src/hooks/api`: API hooks for backend resources
- `src/lib`: shared helpers, query client, SDK utilities
- `src/providers`: app-level providers and routing
- `src/extensions`: extension manager and plugin APIs
- `src/components`: reusable UI/table building blocks

## Optional Messaging Integration

Code paths for TalkJS exist (`src/providers/talkjs-provider`, `src/routes/messages`), but messaging can be disabled by leaving `VITE_TALK_JS_APP_ID` unset.
