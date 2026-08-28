---
'@scalar/helpers': patch
---

chore: bump the default Playwright runner image to 1.62.1

`getDockerServer` now defaults to the Chromium-only `scalarapi/playwright-runner:1.62.1` image, matching the `@playwright/test` version used across the workspace so the client and container speak the same protocol.
