---
'@scalar/docusaurus': patch
---

Load the standalone bundle only on API reference routes and destroy the reference on unmount, so its styles no longer leak into other pages.
