---
'@scalar/components': patch
---

`ScalarModal` now renders `ScalarDialog`, the native `<dialog>` modal, instead of the Headless UI dialog. Its props, sizes and variants are unchanged. `ScalarDialog` also stays hidden while closed, even when a consumer class sets its display.
