# galaxy-scalar-com

## 0.2.25

### Patch Changes

- [#9628](https://github.com/scalar/scalar/pull/9628): Add the Scalar Galaxy AsyncAPI document as a source on galaxy.scalar.com, so the event-driven side of the Galaxy is rendered alongside the OpenAPI reference.

## 0.2.24

### Patch Changes

- [#9576](https://github.com/scalar/scalar/pull/9576): Fix Cloudflare Pages deploys failing to publish the worker (`No such module "node:http"`). Compatibility settings now live in a `cloudflare/wrangler.jsonc` config that the deploy discovers via `--cwd`, so `nodejs_compat` is applied at runtime for both production and PR-preview environments — the `build` script's `--compatibility-*` flags only configured the dry-run bundle.

## 0.2.23

### Patch Changes

- [#9322](https://github.com/scalar/scalar/pull/9322): Render staging and PR-preview deployments with the `@scalar/api-reference` bundle built from the current branch, so reference UI changes can be reviewed before they are released. Production keeps loading the published bundle from the jsDelivr CDN.

## 0.2.22

### Patch Changes

- [#9306](https://github.com/scalar/scalar/pull/9306): chore: deploy galaxy-scalar-com to Cloudflare Pages

## 0.2.21

### Patch Changes

- [#9043](https://github.com/scalar/scalar/pull/9043): chore: move test documents to cdn
