---
'@scalar/api-reference': patch
'@scalar/types': patch
---

fix(api-reference): accessibility pass over the schema tree and parameter rows

Restores list semantics on the four lists the theme reset strips, which Safari and VoiceOver otherwise drop entirely. Gives the parameter row trigger a real focus indicator instead of drawing one on its 12px caret. Makes the Default and Examples popovers dismissible with Escape and openable by click or tap, with `aria-expanded` on their triggers — previously they revealed on hover and focus through CSS alone, so Enter did nothing and touch could not reach them at all. Names the copy buttons that previously announced as their bare value, adding `common.copyDefault` and `common.copyExample` across all eight locales. Gives the single content type readout a role, and honours `prefers-reduced-motion`.

The collapsible section trigger no longer nests the copy-link button inside the toggle button. Nested buttons are invalid, and the parser hoisted the inner one out, so the copy-link sat outside the control it appeared to belong to.

`ScreenReader` moves off the deprecated `clip` property to `clip-path` and adds `white-space: nowrap`, so multi-word announcements are no longer split at wrapped word boundaries. Its visually-hidden style is now a shared `.screenreader-only` class rather than a scoped one, so other components can hide text without wrapping it in the component.

No visual change: every fix above is either invisible, or applies only to focus, hover, or an explicit reduced-motion preference.
