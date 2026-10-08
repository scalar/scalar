---
'@scalar/api-reference': minor
'@scalar/types': patch
'@scalar/helpers': patch
---

feat(api-reference): show an "Explore Scalar" call to action in the sidebar footer on localhost instead of the "Generate MCP" fan-out. The button expands on hover or focus into a card with the Scalar stickers and opens a dialog (morphing into it where the View Transitions API is available) with "Sign up for Scalar" and "Book a demo" actions. Public hosts, configured MCP servers and `mcp.disabled` keep their current footer. Adds `exploreScalar` translations to `ApiReferenceTranslations` and a `startViewTransition` helper to `@scalar/helpers/dom`.
