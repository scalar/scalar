---
'@scalar/api-reference': patch
---

fix(api-reference): make x-tagGroups titles navigable from search

Tag group titles appeared as search results but clicking them did nothing,
because the flattened modern layout rendered no element carrying the tag
group id to scroll to. The group now exposes its id as a scroll anchor.
