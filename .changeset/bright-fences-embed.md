---
'@scalar/highlight': minor
---

Close more of the highlighting gap with TextMate grammars, without slowing anything outside Markdown.

- **Markdown** fenced code blocks are highlighted with the language they name (` ```ts `, `~~~sh`, any registered language or alias). Fences that name no registered language, and fences of four or more backticks, stay plain strings.
- `embed.language` can be `REMEMBERED`, which embeds whatever language the rule that entered the state remembered. Markdown fences use it.
- **SQL** scopes common T-SQL and PL/SQL keywords and types (`DECLARE`, `PRINT`, `GO`, `EXEC`, `RETURN`, `VARCHAR2`, `NUMBER`, …).
- **JavaScript and TypeScript** scope the name a `const`, `let` or `var` declares, read a regex after a control condition (`if (ok) /re/.test(s)`), and colour a tagged template's tag (`` gql`…` ``) as a call.
- **Shell** scopes unquoted arguments as strings, as TextMate grammars do.
