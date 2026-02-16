# Operations Runbook

## Local Setup

Install and run:

```bash
yarn install
cp .env.template .env.local
yarn dev
```

## Daily Commands

```bash
yarn dev
yarn lint
yarn test
yarn typecheck
yarn format:check
yarn build
```

## Utility Commands

```bash
yarn i18n:validate
yarn i18n:schema
yarn generate:static
```

## Integration Validation

When changing API-driven features:

1. Confirm `VITE_MEDUSA_BACKEND_URL`.
2. Validate auth flow and protected routes.
3. Validate one create/update/read flow in changed domain.
4. Validate deep-link browser refresh.

## Common Issues

### API requests fail

Cause:

- incorrect backend URL
- backend unavailable or CORS mismatch

Fix:

1. Verify `VITE_MEDUSA_BACKEND_URL`.
2. Verify backend health and CORS.
3. Restart dev/build after env changes.

### Unexpected registration behavior

Cause:

- `VITE_DISABLE_SELLERS_REGISTRATION` not set as expected.

Fix:

1. Set variable explicitly (`true`/`false`).
2. Rebuild and retest registration routes.

### Deep link 404 on refresh

Cause:

- missing SPA rewrite in deployment.

Fix:

1. Ensure `vercel.json` rewrite is present.
2. Redeploy.

## Change Management Checklist

1. Update docs for env/config changes.
2. Run lint/test/typecheck/build before merge.
3. Smoke test critical flows after deployment.
