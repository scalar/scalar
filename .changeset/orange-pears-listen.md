---
'@scalar/themes': patch
'@scalar/api-reference': patch
'@scalar/docusaurus': patch
'@scalar/nestjs-api-reference': patch
'@scalar/nextjs-api-reference': patch
'@scalar/sveltekit': patch
'@scalar/hono-api-reference': patch
---

Raise muted text, code-string blue and the deprecated schema row to the 4.5:1 text contrast minimum across the shipped themes

An accessibility audit turned up text that is legible in the default theme but not in several of the presets, which pair the default greys and blues with an off-white page background. Nine presets and four integration themes get a hue-preserving nudge:

- Light `--scalar-color-2` now clears 4.5:1 on both the page background and the grey card background in every preset. That covers `alternate`, `bluePlanet`, `mars` and `saturn`, which paired the default grey with an off-white page, and `custom-theme-starter`, `deepSpace`, `elysiajs`, `fastify`, `kepler` and `purple`, which copied the default grey and were left behind when the default moved.
- Light `--scalar-color-blue`, which colours code strings, now clears 4.5:1 on the grey example background in `alternate`, `bluePlanet`, `deepSpace`, `elysiajs`, `fastify`, `kepler` and `moon`, and in the Docusaurus, NestJS, Next.js and SvelteKit themes.
- Dark `--scalar-color-blue` now clears 4.5:1 in `purple` and `saturn`, and in the Hono and Docusaurus dark themes.
- Deprecated schema rows no longer fade their contents to 75% opacity, which had dropped their muted text to 3.0:1. The diagonal stripes, the strikethrough on the property name and the Deprecated badge still mark the row.
- The AsyncAPI send and receive pills blend their label further toward the body text colour, so they read against the tinted fill in every preset but `laserwave`.
- `--scalar-focus-color` sits further from the accent so a keyboard focus ring clears 3:1 on `--scalar-background-3` as well, which some presets use for the selected sidebar item.

`laserwave` still misses in light mode, where it reuses its dark accents unchanged; bringing it up is a redesign of the preset rather than a nudge.
