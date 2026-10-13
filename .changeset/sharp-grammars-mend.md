---
'@scalar/highlight': minor
---

Fix the highlighting breakages a comparison against Shiki and `@scalar/code-highlight` found, and add Julia.

- **PHP** snippets without `<?php` (every Guzzle, Laravel and curl sample snippetz generates) are read as code instead of rendering as plain text. Heredocs close only on their own marker.
- **Julia** has a grammar, so `julia/http` code samples are highlighted.
- **Shell**: `'\''`, the way snippetz writes an apostrophe inside a single-quoted curl body, no longer flips strings and code for the rest of the sample. Heredocs close only on their terminator, and a quoted marker (`<<'EOF'`) turns expansion off.
- **YAML** block scalars end where their indentation does, so prose such as `Note: …` inside a `description: |` stays a string. `#` starts a comment only after whitespace, commas stay inside plain scalars, and flow collections (`{a: 1, b: [x, y]}`) get their own state.
- **HTML, XML, SVG and Vue** highlight `<script>` and `<style>` bodies with the JavaScript and CSS grammars when those are registered. `<?xml …?>` is scoped as metadata instead of a comment, and unquoted attribute values as strings.
- **C#** raw strings close only on the run of quotes that opened them, so `""""…""""` can hold `"""`. **Rust** raw strings close on their own `#` run, and block comments nest. **R** raw strings and **OCaml** quoted strings close on their own delimiter, and OCaml no longer ends a comment at `"*)"`.
- **CSS** reads an unquoted `url(https://…)` as a string instead of starting a `//` comment.
- A lone `\r`, U+2028 or U+2029 inside a string no longer ends it early in any grammar.
- Unterminated `/*`, `<!--` and quotes, and runs of blank lines in JavaScript, no longer cost quadratic time.
- **Markdown** fences close only on a run at least as long as the opener, and HTML comments are scoped.
- `@scalar/highlight/compat` masks credentials on the token stream: a secret the tokenizer splits (`sk_live.abc123` unquoted) is masked, one containing `&` or `<` is masked, and a credential that reads like markup (`span`, `class`) no longer corrupts the HTML.

Grammars gain two features. `remember` lets a rule that enters a state remember a capture group, which that state matches again with `REMEMBERED` (`{{remembered}}`) — the cross-state stand-in for a backreference. `embed` hands a state's body to another registered language until a closing pattern.
