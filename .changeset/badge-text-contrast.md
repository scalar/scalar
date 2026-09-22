---
'@scalar/api-reference': patch
---

fix(api-reference): pick badge text color from the background's lightness

A colored `x-badges` entry used a darker shade of its own background as text, which is muddy on mid-tone colors and only mid-gray on pale ones. The text is now black on light backgrounds and white on dark ones, derived in CSS from the background's lightness, so every color format works. Browsers without relative color syntax keep the previous shading.
