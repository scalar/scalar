# Scalar Dependency Updates Plan

**Generated:** March 12, 2025  
**Audit Summary:** 116 vulnerabilities (4 critical, 54 high, 35 moderate, 23 low)

---

## Executive Summary

This plan prioritizes **high-confidence, low-risk** updates. It is organized into phases to minimize breaking changes and allow incremental validation.

---

## Phase 1: Critical & High-Impact Security Fixes (pnpm overrides)

These vulnerabilities affect **transitive dependencies** and can be fixed via `pnpm.overrides` in the root `package.json` without changing direct dependencies.

### 1.1 Add pnpm overrides (root package.json)

```json
"pnpm": {
  "overrides": {
    "@types/node": "catalog:*",
    "form-data": ">=2.5.4",
    "fast-xml-parser": ">=5.3.5",
    "glob": ">=10.5.0",
    "minimatch": ">=10.2.1",
    "axios": ">=1.13.5",
    "cross-spawn": ">=6.0.6",
    "validator": ">=13.15.22",
    "tar": ">=7.5.8",
    "rollup": ">=4.59.0",
    "node-forge": ">=1.3.2",
    "jws": ">=4.0.1",
    "devalue": ">=5.6.4",
    "h3": ">=1.15.5",
    "@isaacs/brace-expansion": ">=5.0.1",
    "find-my-way": ">=8.2.2"
  }
}
```

**Caveats:**
- `form-data`, `fast-xml-parser`, `jws` come from `@google-cloud/storage` (workspace-store). Consider whether workspace-store actually needs GCS in production or if it's dev-only.
- `path-to-regexp` (NestJS Swagger, Docusaurus) requires upstream package updates—override may cause incompatibility.
- `find-my-way`: Fastify 4.x uses 8.2.0 (vulnerable). Add override `find-my-way: ">=8.2.2"` to fix, or upgrade integrations/fastify to Fastify 5.
- `simple-git` (Nuxt devtools) and `@sveltejs/kit` require Nuxt/SvelteKit upgrades.
- `storybook` WebSocket hijacking: upgrade Storybook in `@scalar/components` to >=10.2.10.

---

## Phase 2: Direct Dependency Upgrades (High Confidence)

### 2.1 Catalog updates (pnpm-workspace.yaml)

| Package | Current | Target | Risk | Notes |
|---------|---------|--------|------|-------|
| `fastify` | ^5.3.3 | ^5.7.2 | Low | Fixes Content-Type bypass (GHSA-jx2c-rxcm-jvmq). Update catalog + fix `integrations/fastify` which pins `^4.0.0` |
| `@ai-sdk/vue` | 3.0.33 | 3.0.116 | Low | Patch updates |
| `ai` | 6.0.33 | 6.0.116 | Low | Patch updates |
| `@floating-ui/vue` | 1.1.9 | 1.1.11 | Low | Patch |
| `@floating-ui/utils` | 0.2.10 | 0.2.11 | Low | Patch |
| `@hono/node-server` | ^1.19.7 | ^1.19.11 | Low | Patch |
| `hono` | 4.12.4 | 4.12.7 | Low | Patch |
| `vue` | ^3.5.26 | ^3.5.30 | Low | Patch |
| `react` / `react-dom` | 19.2.3 | 19.2.4 | Low | Patch |
| `@vitejs/plugin-vue` | ^6.0.3 | ^6.0.5 | Low | Patch |
| `@nestjs/*` (all) | 11.x | 11.1.16 | Low | Patch |
| `@unhead/vue` | 2.1.4 | 2.1.12 | Low | Patch |
| `@vue/server-renderer` | 3.5.26 | 3.5.30 | Low | Patch |
| `fake-indexeddb` | 6.2.3 | 6.2.5 | Low | Patch |
| `postcss` | 8.5.6 | 8.5.8 | Low | Patch |
| `autoprefixer` | 10.4.21 | 10.4.27 | Low | Patch |
| `nodemon` | 3.1.11 | 3.1.14 | Low | Root devDep |
| `tsc-alias` | 1.8.10 | 1.8.16 | Low | Root devDep |
| `turbo` | 2.8.11 | 2.8.16 | Low | Root devDep |
| `vite-svg-loader` | 5.1.0 | 5.1.1 | Low | Patch |
| `semver` | 7.7.2 | 7.7.4 | Low | Build scripts |
| `rxjs` | 7.8.1 | 7.8.2 | Low | NestJS examples |
| `ts-loader` | 9.5.1 | 9.5.4 | Low | NestJS examples |

### 2.2 Package-specific fixes

| Location | Package | Action |
|----------|---------|--------|
| `integrations/fastify` | fastify | Change `^4.0.0` → `catalog:*` or `^5.7.2` (breaking: Fastify 5 has API changes) |
| `packages/components` | storybook | Upgrade to >=10.2.10 (fixes WebSocket hijacking) |
| `packages/components` | svglint | Consider replacing—svglint pulls in vulnerable `fast-xml-parser`. Alternative: use `svgo` or inline SVG linting |
| `packages/api-client` | @vueuse/integrations→axios | Override axios or upgrade @vueuse/integrations |
| `integrations/express` | swagger-jsdoc | Deep chain to validator—override validator |
| Root | remark-cli | Upgrade to get glob>=10.5.0, minimatch fixes |

---

## Phase 3: Medium-Risk Updates (Require Testing)

| Package | Current | Latest | Breaking Risk |
|---------|---------|--------|---------------|
| `vite` | 7.3.1 | 8.0.0 | **High** – Major version, test all build pipelines |
| `vue-router` | 4.6.2 | 5.0.3 | **High** – Vue Router 5 has breaking changes |
| `vue-eslint-parser` | 9.4.3 | 10.4.0 | Medium – Major version |
| `vue-sonner` | 1.1.2 | 2.0.9 | Medium – Major version |
| `whatwg-mimetype` | 4.0.0 | 5.0.0 | Medium – Major version |
| `postcss-nesting` | 12.1.5 | 14.0.0 | Medium |
| `style-loader` | 3.3.4 | 4.0.0 | Medium |
| `vite-plugin-css-injected-by-js` | 3.5.2 | 4.0.1 | Medium |
| `webpack-cli` | 5.1.4 | 6.0.1 | Medium |
| `webpack-dev-server` | 4.15.2 | 5.2.3 | Medium |
| `esbuild` | 0.25.6 | 0.27.4 | Low–Medium |
| `monaco-editor` | 0.54.0 | 0.55.1 | Low |
| `reflect-metadata` | 0.1.14 | 0.2.2 | Medium – Major |
| `@swc/cli` | 0.1.65 | 0.8.0 | High – Major jump |

---

## Phase 4: Cleanup & Deprecation Notes

### 4.1 Duplicate Prettier plugins

Root `package.json` has **both**:
- `@ianvs/prettier-plugin-sort-imports` (used in `.prettierrc`)
- `@trivago/prettier-plugin-sort-imports` (used in `packages/components/.prettierrc`)

**Recommendation:** Standardize on one. Both are maintained. `@trivago` has more config options; `@ianvs` is simpler. Pick one and remove the other to reduce bundle size and confusion.

### 4.2 Packages with deep transitive vulnerabilities

| Path | Vulnerable Chain | Fix Strategy |
|------|------------------|--------------|
| `packages/workspace-store` | @google-cloud/storage → form-data, fast-xml-parser, jws | Override or evaluate if GCS is needed |
| `examples/nuxt` | nuxt → simple-git, devalue, h3, node-forge, tar, minimatch, rollup | Upgrade Nuxt to latest; many fixes in framework |
| `examples/sveltekit` | @sveltejs/kit | Upgrade to >=2.49.5 |
| `integrations/docusaurus` | @docusaurus/core → path-to-regexp | Override path-to-regexp to >=1.9.0 (check compatibility) |
| `examples/nestjs` | @nestjs/swagger → path-to-regexp | Override path-to-regexp to >=3.3.0 (check compatibility) |
| `integrations/fastify` | fastify → find-my-way | Upgrade fastify to 5.7.2+ (find-my-way fix may need fastify 6) |

---

## Recommended Execution Order

1. **Phase 1:** Add pnpm overrides for transitive vulns. Run `pnpm install` and `pnpm build` to verify.
2. **Phase 2.1:** Update catalog versions in `pnpm-workspace.yaml` for low-risk packages.
3. **Phase 2.2:** Fix `integrations/fastify` fastify version; upgrade Storybook in components.
4. **Phase 3:** Defer major upgrades (Vite 8, Vue Router 5) to a dedicated sprint with full regression testing.
5. **Phase 4:** Consolidate Prettier plugins in a separate chore PR.

---

## Validation Checklist

After each phase:
- [ ] `pnpm install`
- [ ] `pnpm build`
- [ ] `pnpm test`
- [ ] `pnpm types:check`
- [ ] `pnpm lint:check`
- [ ] Manual smoke test of API Reference, API Client, and key integrations

---

## References

- [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides)
- [Audit output](.cursor/agent-tools/8359e981-bccb-4883-9de6-48d4241f2d93.txt)
- Vulnerability advisories linked in audit output
