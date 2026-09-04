---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
---

Stop truncating large numeric strings entered into `type: string` array query and header parameters. A value like a 20-digit reference number was accepted as valid JSON, parsed into a JS number, and lost precision beyond `Number.MAX_SAFE_INTEGER` before being sent. Such values now fall back to the comma-split string handling instead of being parsed as a number.
