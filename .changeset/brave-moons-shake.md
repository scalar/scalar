---
'@scalar/api-client': patch
---

fix: tidy the client modal header at narrow widths

The method label and copy button now stay inside the address bar at every width instead of moving to a floating row of their own, and the send button spans the full width once it wraps. Below the `md` breakpoint, where the sidebar covers the whole panel, the sidebar toggle moves onto the backdrop as a circle that mirrors the close button in the opposite corner. At wider widths it keeps its place inside the panel.
