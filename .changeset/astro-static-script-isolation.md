---
'@scalar/astro': patch
---

Move the `renderMode="client"` markup and bundled `<script>` into a dedicated `ScalarClient.astro` child component, so static-mode pages no longer pull in the client mount code or register view-transition listeners they do not need.
