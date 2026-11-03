---
'@scalar/workspace-store': patch
---

Generate valid examples for known string formats in request bodies, including dates, times, durations, addresses, URIs, pointers, regular expressions, and version-specific UUIDs. Preserve existing password, binary, and unknown-format fallbacks.

Also generate formatted query and header values in code samples and querystring parameters. Versioned UUID formats (`uuid1`–`uuid8`) now use matching version bits instead of the generic UUID, including in mock-server and response examples. Generate date/time values at request time so reused schemas stay current in long-lived tabs.
