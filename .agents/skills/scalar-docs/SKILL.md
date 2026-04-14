---
name: scalar-docs
description: Create and maintain Scalar Docs projects with clear navigation, consistent content structure, and production-ready configuration.
---

# Scalar Docs

Use this skill when creating or updating Scalar Docs projects, especially `scalar.config.json` and docs content in `documentation/`.

## When to use

- You are creating or editing Docs guides in `documentation/`.
- You need to update navigation or routing in `scalar.config.json`.
- You are documenting Docs features such as deployment, configuration, or components.

## Baseline configuration rules

- File: `scalar.config.json` (or `scalar.config.json5`).
- Add schema for autocomplete/validation: `https://registry.scalar.com/@scalar/schemas/config`.
- Use `"scalar": "2.0.0"` for the current format.
- Keep `info`, `navigation.routes`, and `siteConfig` aligned with actual content and deployment setup.

## Quick start commands

```bash
npx @scalar/cli project init
npx @scalar/cli project check-config
npx @scalar/cli project preview
```

Use `project check-config` after edits to catch structural mistakes early.

## Core workflow for docs changes

1. **Confirm information architecture**
   - Place content in the correct `documentation/guides/docs/` area.
   - Keep page names and route slugs clear and stable.

2. **Update navigation**
   - Add or adjust routes in `scalar.config.json`.
   - Keep new pages grouped under the most relevant Docs section.

3. **Write practical, copy-pasteable instructions**
   - Provide exact commands users can run.
   - Prefer short examples over long conceptual sections.

4. **Keep terminology consistent**
   - Use OpenAPI-focused terms consistently across documentation.
   - Avoid mixing incompatible wording for the same concept.

5. **Validate discoverability**
   - Ensure the page is reachable from navigation.
   - Verify links and command snippets align with actual repo behavior.

## Navigation implementation checklist

- Use the correct route type:
  - `type: "page"` for Markdown/MDX files.
  - `type: "openapi"` for API references (file, Registry, or URL).
  - `type: "group"` for structured navigation sections.
  - `type: "link"` for external URLs.
- For `group`/`openapi`, choose `mode` deliberately (`folder`, `flat`, `nested`).
- Keep `title`, `filepath`/`url`, and slug consistent to avoid confusing URLs.

## siteConfig checklist

- Domain: `subdomain` or `customDomain` (optionally `subpath` for multi-project setups).
- Branding: `theme`, `logo`.
- Document head: `head.meta`, `head.links`, `head.scripts`, `head.styles`.
- Redirects and path behavior: `siteConfig.routing`.
- Static assets path: `assetsDir`.

## Quality checklist

- The new page has a clear purpose and actionable steps.
- Any command examples are current and runnable.
- `scalar.config.json` includes the new page in the correct section.
- Links between related Docs pages are present where useful.
