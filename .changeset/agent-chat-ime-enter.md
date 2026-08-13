---
'@scalar/agent-chat': patch
---

Do not send the chat message while an IME composition is in progress. Pressing Enter to confirm Japanese, Chinese, or Korean input used to send the message too early and drop part of the text (macOS Chrome and Safari). Enter now sends only once composition has finished.
