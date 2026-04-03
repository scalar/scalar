# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "500" [level=1] [ref=e4]
  - paragraph [ref=e5]: Cannot destructure property 'mod' of 'threads.workerData' as it is undefined.
  - link "Customize this page" [ref=e6] [cursor=pointer]:
    - /url: https://nuxt.com/docs/getting-started/error-handling?utm_source=nuxt-error-dev-page
  - generic [ref=e9]:
    - text: at workerThread (/workspace/node_modules/.pnpm/web-worker@1.2.0/node_modules/web-worker/cjs/node.js:151:5)
    - generic [ref=e10]: at Object. (/workspace/node_modules/.pnpm/web-worker@1.2.0/node_modules/web-worker/cjs/node.js:79:56)
    - text: at Module._compile (node:internal/modules/cjs/loader:1812:14) at Object..js (node:internal/modules/cjs/loader:1943:10) at Module.load (node:internal/modules/cjs/loader:1533:32) at Module._load (node:internal/modules/cjs/loader:1335:12) at wrapModuleLoad (node:internal/modules/cjs/loader:255:19) at loadCJSModuleWithModuleLoad (node:internal/modules/esm/translators:328:3)
    - generic [ref=e11]: at ModuleWrap. (node:internal/modules/esm/translators:233:7)
    - text: at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
```