---
'@scalar/api-reference': patch
---

fix(api-reference): correct selected state, focus ring, target size and reflow of reference controls

- Client library tabs no longer announce a featured tab as selected while a client picked from "More" is active
- The response card "Copy example value" button shows a keyboard focus ring again
- The schema tree toggle keeps its 24px hit box in narrow layouts
- The schema property copy-link button gets a 24px hit box without changing its layout
- Heading copy-link buttons no longer widen the page in narrow layouts
