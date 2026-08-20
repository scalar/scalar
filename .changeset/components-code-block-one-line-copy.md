---
'@scalar/components': patch
---

Keep the copy button off the end of one-line code blocks. On a single-line `ScalarCodeBlock` the copy button is centered over the only line there is, so the tail of a long snippet (an install command ending in a repository URL, for example) stayed underneath the button and its label even when scrolled all the way right. One-line blocks with a copy button now reserve trailing space on the line so it can scroll clear of the button.
