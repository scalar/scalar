---
'@scalar/use-toasts': patch
---

Show a toast fired right before its modal closes. A toast followed by closing a modal that unmounts on close (`toast(); modal.hide()`) moved the toaster into the dialog as it left the page, so the toast never appeared.
