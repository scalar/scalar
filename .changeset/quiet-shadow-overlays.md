---
"@scalar/use-hooks": patch
"@scalar/components": patch
"@scalar/api-client": patch
---

Resolve embedded reference overlays and floating targets within their owning shadow root. Keep embedded color preferences independent of the host and other custom elements.

Keep embedded Scalar dialogs inside the shadow root with native modal focus and dismissal behavior. Scope search keyboard shortcuts to the focused embed.

Scope tooltip portals, timers, and listeners to each embedding root and clean them up when the embed unmounts.

Use a native shadow-root dialog for the embedded request client, preserve its editor state while closed, scope keyboard shortcuts to the owning root, and stop proxy synchronization when the modal unmounts.
