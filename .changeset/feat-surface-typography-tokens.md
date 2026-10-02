---
'@scalar/api-reference': patch
---

feat(api-reference): add per-surface typography CSS custom properties

Introduces scoped CSS custom property tokens that let consumers independently
control text size, weight, colour, and letter-spacing for each distinct surface:

- `--refs-badge-*` — HTTP method badges in the sidebar and body pane (GET, POST, PUT, DELETE …)
- `--refs-body-*` — Operation title, path, and section headings in the content area
- `--refs-server-*` — Server selector label and URL text
- `--refs-sidebar-*` — Sidebar item label font size and weight
- `--refs-tag-*` — Tag section headings

All tokens fall back to the existing global `--scalar-*` design tokens, so
nothing changes visually unless a consumer explicitly sets a token.

Example usage:

```css
.scalar-app {
  --refs-badge-font-size: 11px;
  --refs-badge-color-post: #00b050;
  --refs-body-title-font-size: 28px;
  --refs-tag-font-size: 22px;
  --refs-sidebar-font-size: 13px;
}
```
