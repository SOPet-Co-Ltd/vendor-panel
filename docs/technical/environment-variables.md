# Environment Variables

## Source of Truth

- `.env.template`
- `vite.config.mts`
- `src/vite-env.d.ts`

## Required Variables

```env
VITE_MEDUSA_BASE=/
VITE_MEDUSA_STOREFRONT_URL=http://localhost:3000
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_DISABLE_SELLERS_REGISTRATION=false
```

## Optional Variables

```env
VITE_MEDUSA_PROJECT=
VITE_PUBLISHABLE_API_KEY=
VITE_TALK_JS_APP_ID=
```

## Variable Reference

- `VITE_MEDUSA_BASE`: SPA basename used by router/invite links
- `VITE_MEDUSA_STOREFRONT_URL`: storefront URL reference
- `VITE_MEDUSA_BACKEND_URL`: backend API base URL
- `VITE_DISABLE_SELLERS_REGISTRATION`: toggles seller registration path behavior
- `VITE_MEDUSA_PROJECT`: optional extension source project
- `VITE_PUBLISHABLE_API_KEY`: optional publishable key injection
- `VITE_TALK_JS_APP_ID`: optional messaging app ID

## Build Injection Mapping

- `VITE_MEDUSA_BASE` -> `__BASE__`
- `VITE_MEDUSA_BACKEND_URL` -> `__BACKEND_URL__`
- `VITE_MEDUSA_STOREFRONT_URL` -> `__STOREFRONT_URL__`
- `VITE_PUBLISHABLE_API_KEY` -> `__PUBLISHABLE_API_KEY__`
- `VITE_TALK_JS_APP_ID` -> `__TALK_JS_APP_ID__`
- `VITE_DISABLE_SELLERS_REGISTRATION` -> `__DISABLE_SELLERS_REGISTRATION__`

If `VITE_TALK_JS_APP_ID` is empty, messaging UI falls back to a non-integrated placeholder state.
