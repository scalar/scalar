---
'@scalar/api-reference': patch
---

Fix sidebar navigation scrolling past operations and models in themes with decorative backgrounds.

Measure only headers registered with `data-scalar-scroll-header` when scrolling to content. Scalar registers its mobile header and sticky breadcrumb bar automatically; embedding sites can register their own fixed or sticky headers with the same attribute.

Host headers are no longer discovered automatically. Register fixed or sticky host headers with `data-scalar-scroll-header`, or reserve their height with `--scalar-custom-header-height`. Registered Scalar breadcrumbs are counted below that reserved space.
