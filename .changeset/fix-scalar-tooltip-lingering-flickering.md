---
'@scalar/components': patch
---

Fix lingering and flickering ScalarTooltip behavior

- Dismiss the tooltip when the user clicks anywhere outside the tooltip or its target element, matching native browser tooltip behavior
- Add a 100ms debounce when hiding the tooltip on `mouseleave` to prevent flickering when the cursor briefly crosses the gap between the target and the tooltip
- Cancel the hide debounce when the cursor enters the tooltip element itself
