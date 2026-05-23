---
'@scalar/pre-post-request-scripts': patch
'@scalar/oas-utils': patch
'@scalar/api-client': patch
---

perf: warm up the request scripts sandbox on mount when scripts are present, so the first request no longer pays the sandbox cold-start cost
