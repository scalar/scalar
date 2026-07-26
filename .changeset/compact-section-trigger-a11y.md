---
'@scalar/api-reference': patch
---

fix: give the collapsible section trigger an accessible name and a valid `aria-controls` target

The trigger button rendered by `CompactSection` carried `aria-controls` set to its own `id`, so it declared that it controls itself, and it exposed no accessible name of its own. Screen reader users heard an unnamed button, and axe-core reported `button-name` and `aria-allowed-attr` on every model section. The trigger now takes its name from the section `label` and points `aria-controls` at the collapsible region, which carries its own id. While the section is collapsed the attribute is dropped entirely rather than left pointing at an element that is not rendered.
