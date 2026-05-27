---
'@scalar/icons': patch
---

The library icon resolver (`@scalar/icons/library`) now eagerly bundles the `interface-content-folder` SVG and pre-populates the icon cache with it. This is the default fallback used by `<SidebarItem>` whenever an item doesn't specify a custom `x-scalar-icon`, so the most common path through the sidebar no longer waits on a per-icon dynamic chunk to resolve. The other 83 SVGs in the library remain lazy.
