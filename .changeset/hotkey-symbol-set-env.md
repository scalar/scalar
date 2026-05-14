---
'@scalar/components': patch
---

fix: respect optional `VITE_SCALAR_HOTKEY_SYMBOL_SET` on ScalarHotkey to override OS-based modifier

This can be really useful when we want to have deterministic results on the CI
