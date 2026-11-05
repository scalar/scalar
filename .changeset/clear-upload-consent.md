---
'@scalar/agent-chat': patch
'@scalar/api-reference': patch
'@scalar/types': patch
---

Ask for explicit confirmation before uploading an API description for Ask AI or a temporary share link, explaining who can access it and when it expires. Saved terms acceptance no longer skips upload confirmation.

Use compact confirmation modals with document identity, link access, and expiry. Cancelling Ask AI consent returns to the composer without uploading the document.
