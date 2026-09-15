---
'@scalar/pre-post-request-scripts': patch
'@scalar/oas-utils': patch
'@scalar/api-client': patch
---

Pass request duration to post-response scripts as `pm.response.responseTime` in milliseconds and enable the response-time example.
