---
'@scalar/components': minor
---

Add `ScalarDialog`, a modal dialog built on the native `<dialog>` element and `showModal()`. Control it with `v-model:open` and compose its contents with the default slot. Focus trapping, focus restore, background inert, and top-layer stacking come from the platform. On top of that it locks page scrolling while open, gives popovers inside it a teleport target so they render above the dialog, lets child widgets handle Escape before the dialog closes, and closes on a backdrop click (ignoring text-selection drags and keyboard-activated controls).
