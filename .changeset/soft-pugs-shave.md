---
'@scalar/api-reference': patch
'@scalar/api-client': patch
'@scalar/components': patch
'@scalar/sidebar': patch
'@scalar/blocks': patch
'@scalar/types': patch
---

fix: address a batch of screen reader and keyboard accessibility findings

Corrects programmatic semantics only, with no change to how anything renders:
the current sidebar item now reports `aria-current`, the single content type
readout leaves the tab order, collapsible sections no longer announce their
title twice, the password toggle reports its state through `aria-pressed`, the
two document download buttons get distinct accessible names, response status
tabs announce what each code means, and the client picker and its search field
get accessible names.
