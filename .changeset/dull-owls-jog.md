---
'@scalar/workspace-store': patch
---

fix: enable a content-based query parameter with an authored media-type example

`getExample` always resolved a content-based parameter's example from `content.*.example`, even when the parameter had its own `examples` entry recording the user's edit (value and enabled state). That edit was ignored, so enabling an optional JSON-content query parameter with a media-type example never added it to the request. Parameter-level examples now take priority over the content media-type example.
