---
'@scalar/components': patch
---

Stop `ScalarDropdown` from scrolling the page to the top of its containing block when it opens. The menu is now focused with `preventScroll`, since Floating UI has not positioned it yet at that point.
