---
'@scalar/api-reference': patch
---

fix: adapt the info links to the rendered width of the reference instead of the viewport

The introduction's info links (contact, license, terms of service, external docs, and `x-scalar-links`), the section header grid, and the classic-layout selector cards switched their layout based on viewport media queries, while the rest of the reference adapts to the rendered width of the reference through the `narrow-references-container` container query. They now restyle based on the container as well, through a new `narrow:` Tailwind variant.
