---
'@scalar/api-reference': patch
---

Render the accordion header's title and actions beside the toggle button instead of inside it. A `button` start tag inside an open `button` implies the end tag for the outer one, so the copy-link button in an AsyncAPI message heading (and the controls in an operation's header) were re-parented by the HTML parser and server-rendered sections could never hydrate. Clicking anywhere in the header still toggles the section.
