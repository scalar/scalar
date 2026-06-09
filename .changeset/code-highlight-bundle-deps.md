---
'@scalar/code-highlight': patch
---

Bundle runtime dependencies into the build so CommonJS-only packages (like `extend` and `debug`) no longer leak to consumers and break Vite dev under pnpm
