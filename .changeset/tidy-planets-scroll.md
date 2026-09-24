---
'@scalar/api-reference': patch
---

Fix sidebar navigation scrolling past operations and models in themes with decorative backgrounds.

Measure only headers registered with `data-scalar-scroll-header` when scrolling to content. Scalar registers its mobile header and sticky breadcrumb bar automatically; embedding sites can register their own fixed or sticky headers with the same attribute.
