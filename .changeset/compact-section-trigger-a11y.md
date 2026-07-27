---
'@scalar/api-reference': patch
---

fix: give the collapsible section trigger an accessible name and a valid `aria-controls` target

The trigger button rendered by `CompactSection` carried `aria-controls` set to its own `id`, so it declared that it controls itself, and it exposed no accessible name of its own. Screen reader users heard an unnamed button, and axe-core reported `button-name` and `aria-allowed-attr` on every model section.

The trigger now points `aria-controls` at the collapsible region, which carries its own id. While the section is collapsed the attribute is dropped entirely rather than left pointing at an element that is not rendered.

The accessible name now comes from `aria-labelledby` pointing at the heading the trigger already renders, so the name is always the visible text. Referencing the heading rather than copying it into an `aria-label` means the name cannot drift out of sync with what is on screen, which is the WCAG 2.5.3 (Label in Name) failure a duplicated string would risk.
