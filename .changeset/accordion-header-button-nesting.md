---
'@scalar/api-reference': patch
---

Render the accordion header's title and actions beside the toggle button instead of inside it. A `button` start tag inside an open `button` implies the end tag for the outer one, so the copy-link button in an AsyncAPI message heading (and the controls in an operation's header) were re-parented by the HTML parser and server-rendered sections could never hydrate. Clicking the header text or caret still toggles the section, while the copy-link and action buttons keep their own behavior.
