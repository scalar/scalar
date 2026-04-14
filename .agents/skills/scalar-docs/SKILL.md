---
name: scalar-docs
description: Create and maintain Scalar Docs projects with clear navigation, consistent content structure, and production-ready configuration.
---

# Scalar Docs

Use this skill when working on Scalar Docs content, structure, and configuration.

## When to use

- You are creating or editing Docs guides in `documentation/`.
- You need to update navigation or routing in `scalar.config.json`.
- You are documenting Docs features such as deployment, configuration, or components.

## Core workflow

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

## Quality checklist

- The new page has a clear purpose and actionable steps.
- Any command examples are current and runnable.
- `scalar.config.json` includes the new page in the correct section.
- Links between related Docs pages are present where useful.
