---
'@scalar/api-client': patch
---

- feat: send query parameters
- feat: add a readOnly prop to the <APIClient /> component
- fix: removed broken button loading state, replaced with boring loader animation
- fix: z-index issue with API client, search and the request history
- refactor: replace font sizes with variables, fix some minor font size issues
- remove default User-Agent header (browser doesn’t like setting the User-Agent header)
- chore: moved FlowModal to its own package
