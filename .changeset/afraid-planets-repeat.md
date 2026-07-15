---
'@scalar/themes': minor
'@scalar/agent-chat': patch
'@scalar/api-reference': patch
'@scalar/api-client': patch
'@scalar/components': patch
---

feat(themes): derive the border radius scale from `--scalar-radius`

The radius tokens used to be independent, so setting `--scalar-radius: 0` still left rounded corners
behind on anything using `--scalar-radius-lg`, `--scalar-radius-xl` or `rounded-full`. They now all
derive from `--scalar-radius`, which means overriding that single variable rescales every corner in the
interface, and `0` squares it off completely.

Two new tokens fill out the scale, `--scalar-radius-2xl` (12px) and `--scalar-radius-3xl` (16px), along
with `--scalar-radius-full` for pills and circles. The matching `rounded-2xl` and `rounded-3xl` Tailwind
utilities now emit CSS; previously they were silently dropped.

Every default value is unchanged, so nothing shifts unless you were relying on the old behaviour. If
your theme sets `--scalar-radius` on its own and expects the larger radii to stay put, set those tokens
explicitly. Override `--scalar-radius` on `:root`: a custom property substitutes `var()` at the element
where it is declared, so setting the base further down the tree moves it without moving anything derived
from it.
