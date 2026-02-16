# Deployment

## Deployment Target

- Platform: Vercel
- Trigger: GitHub Actions workflow `.github/workflows/deploy.yml`

## Branch Mapping

- `main`: triggers production deploy hook
- `uat`: triggers UAT deploy hook

Workflow behavior:

- Runs on push to `main` or `uat`
- Skips deploy trigger for one filtered commit-author email

## SPA Routing

`vercel.json` config:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

This ensures deep links resolve to SPA entrypoint.

## Release Checklist

1. Confirm backend target is available and compatible.
2. Confirm `VITE_MEDUSA_BACKEND_URL` for target environment.
3. Confirm `VITE_MEDUSA_BASE` and `VITE_MEDUSA_STOREFRONT_URL`.
4. Confirm `VITE_DISABLE_SELLERS_REGISTRATION` expected value.
5. Run validation:
   - `yarn lint`
   - `yarn test`
   - `yarn typecheck`
   - `yarn build`

## Post-Deploy Smoke Test

1. Vendor login and auth navigation.
2. Product list/detail/edit flows.
3. Order list/detail views.
4. Store settings/profile pages.
5. Deep-link refresh on nested routes.

## Rollback

If deployment is unhealthy:

1. Re-deploy previous stable Vercel build.
2. Re-check environment values in Vercel.
3. Verify backend compatibility for current frontend revision.
