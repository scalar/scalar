---
'@scalar/api-reference': patch
---

Fix sidebar overlapping the content at exactly 1000px wide. The layout grid switched to the mobile (stacked) layout at `max-width: 1000px` while the sidebar visibility is driven by Tailwind's `lg:` variant (`min-width: 1000px`), so both fired at 1000px. The mobile breakpoint now uses `width < 1000px`, the exact complement of `lg:`, so 1000px is treated as desktop.
