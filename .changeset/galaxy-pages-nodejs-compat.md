---
'galaxy-scalar-com': patch
---

Fix Cloudflare Pages deploys failing to publish the worker (`No such module "node:http"`). Compatibility settings now live in a `cloudflare/wrangler.jsonc` config that the deploy discovers via `--cwd`, so `nodejs_compat` is applied at runtime for both production and PR-preview environments — the `build` script's `--compatibility-*` flags only configured the dry-run bundle.
