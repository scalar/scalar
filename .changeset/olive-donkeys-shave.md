---
'@scalar/themes': minor
'@scalar/components': patch
---

feat(themes): cap container corners with `--scalar-radius-max`

A large `--scalar-radius` used to curve tall containers hard enough that they swallowed their own
content: dropdown panels clipped their last rows, and code blocks rendered as stadiums.

Every radius token except `--scalar-radius-full` now clamps to a new `--scalar-radius-max`, which
defaults to `20px`. A new `--scalar-radius-md` gives the base radius the same cap, and is what
`rounded`, `rounded-md` and form controls now use. Pills and circles are deliberately exempt, so
avatars, spinners and toggles stay round.

The reset no longer sets a `border-radius` on `:focus-visible`. It was reshaping the focused element
rather than its outline, which meant a large theme radius turned bare focus containers into pills the
moment they were focused. Outlines already follow an element's own corners, so focus rings now match
whatever shape the element actually has.

Defaults are unchanged: every default token sits at or below the cap, so nothing moves unless you were
already setting a very large radius.
