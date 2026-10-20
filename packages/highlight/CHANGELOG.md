# @scalar/highlight

## 0.5.0

### Minor Changes

- [#10668](https://github.com/scalar/scalar/pull/10668): feat: close more gaps with TextMate grammars, and highlight faster
  - Engine: only the wrapper group around each rule captures in a state's merged regex. Past 63 capture groups V8 allocates on every match, which cost large grammars such as C, C++, C#, PHP, Ruby and Python a third of their throughput or more.
  - CSS: `var(--brand)` has the same scope as the `--brand:` it refers to. SCSS `$name` and Less `@name` read whole where they are used, and `$brand: red` at the top level reads as a value rather than a selector.
  - JavaScript/TypeScript: the names in a parameter list read as parameters, destructuring and annotations included; `function f()` names a definition; `with { type: 'json' }` on an import is a keyword.
  - Swift: `#/…/#` and `/…/` regex literals, and the `nonisolated`, `isolated`, `distributed`, `borrowing`, `consuming`, `sending` and `macro` modifiers.
  - Diff: context (`diff -c`) and normal (`diff`) formats, svn `Index:` headers, and `#` comment lines.
  - Ruby: a method called without parentheses, `list.length`, reads as a call, and `p`, `printf`, `warn` and friends as builtins.
  - Go: a package-qualified type, `w http.ResponseWriter` or `*testing.T`, reads as a type where a type goes.
  - nginx: log levels, event methods, rewrite flags, and the names of `upstream` and `map` blocks.
  - Haskell: the names in an import list. Kotlin: `package` and `import` paths, and `tailrec`, `external` and `value class`. C++: calls with explicit template arguments, `any_cast<int>(x)`.
  - Rust: `.await` is a keyword, `self` the receiver and `Self` a type, and `r#type` stays a name. Python: `case 200: return x` with its body on the same line is a keyword. TypeScript: `const id = <T,>(x: T) => x` names a function.

## 0.4.0

### Minor Changes

- [#10621](https://github.com/scalar/scalar/pull/10621): Close more of the highlighting gap with TextMate grammars, without slowing anything outside Markdown.
  - **Markdown** fenced code blocks are highlighted with the language they name (` ```ts `, `~~~sh`, any registered language or alias). Fences that name no registered language, and fences of four or more backticks, stay plain strings.
  - `embed.language` can be `REMEMBERED`, which embeds whatever language the rule that entered the state remembered. Markdown fences use it.
  - **SQL** scopes common T-SQL and PL/SQL keywords and types (`DECLARE`, `PRINT`, `GO`, `EXEC`, `RETURN`, `VARCHAR2`, `NUMBER`, …).
  - **JavaScript and TypeScript** scope the name a `const`, `let` or `var` declares, read a regex after a control condition (`if (ok) /re/.test(s)`), and colour a tagged template's tag (`` gql`…` ``) as a call.
  - **Shell** scopes unquoted arguments as strings, as TextMate grammars do.

  TypeScript const assertions keep the following statement highlighted as code instead of consuming its keyword as a declared name.

- [#10622](https://github.com/scalar/scalar/pull/10622): feat: highlight more embedded languages and keyword-named keys
  - Markdown: front matter is highlighted as YAML, and HTML that starts a line as HTML. A `<script>`, `<pre>` or `<style>` block runs to its closing tag. The last line of front matter is no longer read as a heading.
  - HTTP: a body that starts with `<` is highlighted as XML/HTML.
  - PHP: `<script>` and `<style>` bodies in templates are highlighted as JavaScript and CSS, and a `<?= ?>` region inside them keeps the surrounding JavaScript or CSS state, so `"<?= $name ?>"` stays one string.
  - Engine: an `embed` can declare `holes`, regions of the body the host grammar tokenizes while the embedded language reads across them.
  - CSS: the condition of `@media`, `@supports`, `@container` and `@import` gets keywords, features, numbers and values.
  - JavaScript/TypeScript: a keyword used as an object key (`{ type: 'object' }`, `{ default: 1 }`) reads as a property, `static of()` and `get(key)` read as method names, and `#private` fields are scoped.

  Preserve source text when hole patterns contain capture groups, and keep PHP strings and comments from prematurely closing script or style bodies.

- [#10612](https://github.com/scalar/scalar/pull/10612): Fix the highlighting breakages a comparison against Shiki and `@scalar/code-highlight` found, and add Julia.
  - **PHP** snippets without `<?php` (every Guzzle, Laravel and curl sample snippetz generates) are read as code instead of rendering as plain text. Heredocs close only on their own marker.
  - **Julia** has a grammar, so `julia/http` code samples are highlighted.
  - **Shell**: `'\''`, the way snippetz writes an apostrophe inside a single-quoted curl body, no longer flips strings and code for the rest of the sample. Heredocs close only on their terminator, and a quoted marker (`<<'EOF'`) turns expansion off.
  - **YAML** block scalars end where their indentation does, so prose such as `Note: …` inside a `description: |` stays a string. `#` starts a comment only after whitespace, commas stay inside plain scalars, and flow collections (`{a: 1, b: [x, y]}`) get their own state.
  - **HTML, XML, SVG and Vue** highlight `<script>` and `<style>` bodies with the JavaScript and CSS grammars when those are registered. `<?xml …?>` is scoped as metadata instead of a comment, and unquoted attribute values as strings.
  - **C#** raw strings close only on the run of quotes that opened them, so `""""…""""` can hold `"""`. **Rust** raw strings close on their own `#` run, and block comments nest. **R** raw strings and **OCaml** quoted strings close on their own delimiter, and OCaml no longer ends a comment at `"*)"`.
  - **CSS** reads an unquoted `url(https://…)` as a string instead of starting a `//` comment.
  - A lone `\r`, U+2028 or U+2029 inside a string no longer ends it early in any grammar.
  - Unterminated `/*`, `<!--` and quotes, and runs of blank lines in JavaScript, no longer cost quadratic time.
  - **JavaScript, TypeScript and JSX**: JSX children are read as text, so an apostrophe in `<p>Don't</p>` no longer opens a string to the end of the line. An element opens only where an expression can start, and TypeScript generics (`<T>(x: T) => x`, `<T extends X>`) and `<string>` assertions are not read as tags. A function assigned to a name (`const App = () => …`) is scoped as a function, and a capitalised name followed by a call (`function App()`, `Error('x')`, `new Date()`) is a call rather than a type.
  - **Shell** command names (`curl`, `grep`, `./build.sh`) are scoped, except on a line that continues the one before it.
  - **YAML** plain scalars that wrap onto the next line keep their string color.
  - **Markdown** fences close only on a run at least as long as the opener, and HTML comments are scoped.
  - `@scalar/highlight/compat` masks credentials on the token stream: a secret the tokenizer splits (`sk_live.abc123` unquoted) is masked, one containing `&` or `<` is masked, and a credential that reads like markup (`span`, `class`) no longer corrupts the HTML.

  Grammars gain two features. `remember` lets a rule that enters a state remember a capture group, which that state matches again with `REMEMBERED` (`{{remembered}}`) — the cross-state stand-in for a backreference. `embed` hands a state's body to another registered language until a closing pattern.

  Preserve multiline credential masking, including when line numbers are enabled. Keep defaulted TypeScript generics in code mode, and only embed JavaScript or CSS for complete `script` and `style` tag names so custom elements retain HTML highlighting.

## 0.3.1

### Patch Changes

- [#10559](https://github.com/scalar/scalar/pull/10559): Clean up Biome warnings in package code and tests. Handle rejected debounced callbacks and await streaming writes.

## 0.3.0

### Minor Changes

- [#10033](https://github.com/scalar/scalar/pull/10033): Add `toHast` to `@scalar/highlight/compat`, which highlights into hast element content rather than an HTML string.

  `syntaxHighlight` is the right tool when the destination is HTML. A rehype plugin is the case it does not serve: handing back markup there means parsing it straight back into nodes. `toHast` returns the nodes directly, and `null` for a language with no registered grammar, so a caller can tell "nothing to highlight" from "highlighted to nothing" and leave the block alone.

  Adjacent ranges resolving to the same class merge into one span, matching the string renderer — our scope vocabulary is finer than highlight.js's, so `keyword.declaration` followed by `keyword` has to arrive as a single `hljs-keyword` element rather than two siblings lowlight would never have produced. The tests hold both renderers to the same output span for span across the whole sample corpus, so the two cannot drift.

  No runtime dependency is added: the hast types are type-only.

## 0.2.1

### Patch Changes

- [#9941](https://github.com/scalar/scalar/pull/9941): Republish every package through npm trusted publishing. No functional changes.

## 0.2.0

### Minor Changes

- [#9923](https://github.com/scalar/scalar/pull/9923): Add `@scalar/highlight`, a zero-dependency syntax highlighter. A grammar is plain data describing a small state machine, each state compiles to one merged regular expression, and rendering goes straight to an HTML string without allocating token objects. Languages are separate modules, so importing `python` does not cost you `scala`.

  Entry points are `.` (`highlight`, `highlightBlock`, `tokenize`, the registry and the scope vocabulary), `./core` for the engine alone, `./all` and `./lazy` for eager and code-split registration, `./langs/*` for a single grammar, `./style.css` for the stylesheet, and `./compat`, a drop-in for `@scalar/code-highlight`'s `syntaxHighlight` that emits the same `hljs-*` markup. Nothing currently consumes it — this only adds the package.

### Patch Changes

- [#9913](https://github.com/scalar/scalar/pull/9913): Add Julia (HTTP.jl) as a code example target. The new `julia/http` client generates HTTP.jl snippets, including headers, query parameters, cookies, basic auth, JSON bodies (as `Dict`s serialized with `JSON.json`), url-encoded bodies and `HTTP.Form` multipart uploads. Julia syntax highlighting and a Julia icon are included, so the client shows up in the code example picker like any other language.
