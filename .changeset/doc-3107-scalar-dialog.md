---
'@scalar/components': minor
---

Add `ScalarDialog`, a modal dialog built on the native `<dialog>` element and `showModal()`. Control it with `v-model:open` and compose its contents with the default slot. Focus trapping, focus restore, background inert, Escape-to-close, and top-layer stacking come from the platform; backdrop-click dismissal is handled by a small, tested composable that ignores text-selection drags and keyboard-activated controls.
