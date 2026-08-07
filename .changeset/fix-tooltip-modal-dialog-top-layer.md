---
'@scalar/components': patch
---

fix: show tooltips whose trigger sits inside a modal `<dialog>`

A `<dialog>` opened with `showModal()` is promoted to the browser's top layer, which
paints above the rest of the document no matter what `z-index` anything else carries.
The tooltip element is a shared singleton parented to `<body>`, so it rendered behind
the dialog and was invisible. It now moves into the dialog while it points at a target
in there, and moves back to the body once it is hidden.
