---
'@scalar/api-reference': patch
---

fix: stabilize the tab title at the top of the document

The document-start sentinel and the Introduction section both fire an intersection event at scroll-top. They resolved to different entries, so the tab title raced between the section title and the document title. The sentinel now emits the Introduction entry, so both agree.
