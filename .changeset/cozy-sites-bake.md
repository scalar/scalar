---
'@scalar/api-client': patch
---

Fix modal fade-in animation stutter by replacing v-show with CSS visibility/opacity to avoid forced layout recalculation on open
