---
'@scalar/components': patch
---

Fix `ScalarTooltip` offset gap on `-start` / `-end` placements. The offset was applied as uniform padding on all four sides of the tooltip, which shifted the visible box inward by the offset amount on edge-aligned placements (e.g. `top-start`, `bottom-end`) since Floating UI aligns the floating element's edge with the target's edge. The offset gap is now applied only to the side facing the target, so the tooltip lines up flush with the target on the start/end axis.
