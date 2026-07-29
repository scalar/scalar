---
"@scalar/api-reference": patch
---

Add print styles so printing (or saving to PDF) no longer renders expanded content over the text that follows it. The reference lays itself out as a fixed-viewport application, and its sticky columns were pinned to a screen measurement that is meaningless on paper. Printing now flattens that shell into ordinary document flow: navigation and floating chrome are hidden, sticky positioning and viewport-derived height caps are dropped so long examples are no longer truncated, and small units such as properties and cards avoid breaking across pages.
