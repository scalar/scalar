---
'@scalar/api-reference': patch
---

Fix dark mode background not covering the full scrollable page. The base background color was only applied to `body`, so on pages where `body`'s rendered box is shorter than `html`'s (or where the browser paints the scrollable canvas from `html`), the area below the content stayed light even in dark mode. The background color is now applied to both `html` and `body`.
