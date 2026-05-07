---
'@scalar/api-client': patch
'@scalar/pre-post-request-scripts': patch
'scalar-app': patch
---

feat: optimize layout for mobile

- Hide the document breadcrumb on small screens and surface workspace
  switching from the menu instead, so the top bar stays uncluttered.
- Convert the document save / discard / pull / push / publish buttons to
  header-button styling and only render the trailing divider when there
  are actual cluster buttons next to it.
- Stack the address bar onto two rows on small screens so the URL and
  the action cluster (copy / history / send) each get a full row.
- Hide the "Log in" affordance from the small-screen top bar (the menu
  still owns it) and keep only the primary "Register" CTA there.
- Give the pre-request and post-response script editors proper vertical
  padding so the help text no longer clips when it wraps.
