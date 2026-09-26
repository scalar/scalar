---
'@scalar/api-reference': patch
---

fix: remove the duplicate copy button from the example response header

The response card carried its own copy button in the tab strip, added in 2023 when the card had no other copy affordance. The code block inside it later gained a built-in copy button of its own, which left every response card showing two buttons that copy the same content. Only the code block's button remains.
