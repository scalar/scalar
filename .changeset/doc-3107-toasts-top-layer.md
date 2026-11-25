---
'@scalar/use-toasts': patch
---

Show toasts where the user can see them when a native modal dialog is open. The toaster moves into the topmost open modal, so its toasts paint above it, stay interactive and are announced to screen readers, and moves back once the modal closes. Toasts now go to the most recently mounted toaster that is visible, rather than one left mounted inside a closed modal.
