---
'@scalar/api-reference': patch
---

fix: give the collapsible section trigger an accessible name and a valid `aria-controls` target

The trigger button rendered by `CompactSection` carried `aria-controls` set to its own `id`, so it declared that it controls itself, and it exposed no accessible name of its own. Screen reader users heard an unnamed button, and axe-core reported `button-name` and `aria-allowed-attr` on every model section.

The trigger now points `aria-controls` at the collapsible region, which carries its own id. While the section is collapsed the attribute is dropped entirely rather than left pointing at an element that is not rendered.

The accessible name comes from a new optional `triggerLabel` prop. Models pass the title they actually render (`schema.title ?? name`), so the name always contains the visible heading. The section `label` is deliberately not reused here: a model whose `title` differs from its key would have been announced under a name that never appears on screen, which is the WCAG 2.5.3 (Label in Name) failure the previous approach introduced. When `triggerLabel` is omitted, the heading content names the trigger as before.
