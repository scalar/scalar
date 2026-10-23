# @scalar/highlight

[![Version](https://img.shields.io/npm/v/%40scalar/highlight)](https://www.npmjs.com/package/@scalar/highlight)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/highlight)](https://www.npmjs.com/package/@scalar/highlight)
[![License](https://img.shields.io/npm/l/%40scalar%2Fhighlight)](https://www.npmjs.com/package/@scalar/highlight)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Scalar's code highlighter.

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://github.com/user-attachments/assets/380abb34-8814-4b34-8926-19ab84a91d79">
  <img
    alt="Python, TypeScript, Rust and HTTP highlighted by @scalar/highlight"
    src="https://github.com/user-attachments/assets/8ac62023-f56c-4dcd-a7e3-d0272a43c610">
</picture>

- **Small.** 3.5 KB core, ~1.7 KB for Python, gzipped. Nothing you do not import.
- **No theme system.** Colors come from the `--scalar-*` variables `@scalar/themes` already defines, so a code block follows the app's theme and switches with `.light-mode` / `.dark-mode` — without being re-highlighted.
- **Zero runtime dependencies.**

Forty-one languages ship today: Python, JavaScript/TypeScript/JSX/TSX, Rust, Go, C, C++, C#, F#, Java, Kotlin, Scala, Swift, Objective-C, OCaml, Haskell, Elixir, Clojure, Dart, Julia, Mojo, PHP, Perl, Ruby, Lua, R, MATLAB, Bash, PowerShell, SQL, GraphQL, HTTP, YAML, JSON, TOML/INI, CSS, HTML, Markdown, Dockerfiles, Makefiles, nginx configs, and diffs.

```bash
npm install @scalar/highlight
```

## Quick start

```js
import { highlightBlock, registerLanguage } from '@scalar/highlight';
import python from '@scalar/highlight/langs/python';
import '@scalar/highlight/style.css';

registerLanguage(python);

const html = highlightBlock(source, 'python', { lineNumbers: true });
```

That is the whole setup. `html` is a `<pre class="shl-code">…</pre>` block, and the
stylesheet colors it from the theme already loaded on the page.

> **Requires a mode class.** `@scalar/themes` defines its palette only under
> `.light-mode` or `.dark-mode`, so one of them must be on a container — the same
> contract every other Scalar component has. Without it the block still renders,
> readable but unstyled.

### Loading languages on demand

```js
import { highlight } from '@scalar/highlight';
import { loadLanguage } from '@scalar/highlight/lazy';

await loadLanguage('rust');   // one dynamic import, one bundler chunk
highlight(source, 'rust');
```

Every entry in the loader is a static `import()`, so bundlers split each language into its
own chunk. The initial chunk with the loader and no languages is 5.0 KB.

### Entry points

| Import | What you get |
| --- | --- |
| `@scalar/highlight` | `highlight`, `highlightBlock`, `tokenize`, the registry |
| `@scalar/highlight/style.css` | The stylesheet. Required for color |
| `@scalar/highlight/core` | Just the engine |
| `@scalar/highlight/langs/<name>` | One grammar |
| `@scalar/highlight/lazy` | `loadLanguage`, for code splitting |
| `@scalar/highlight/all` | Every language, registered. For build-time rendering |
| `@scalar/highlight/compat` | Drop-in `syntaxHighlight` for the former `@scalar/code-highlight` |
| `@scalar/highlight/compat/code.css` | The stylesheet for the `hljs-*` classes `compat` emits |

### Rendering somewhere other than HTML

```js
import { tokenize } from '@scalar/highlight';

for (const { scope, text } of tokenize(source, 'python')) {
  // scope is 'keyword.control' | 'string' | … | null
}
```

For hot paths there is a streaming form that allocates nothing per token — it is what the
HTML renderer uses:

```js
import { tokenizeStream, resolveGrammar } from '@scalar/highlight';

tokenizeStream(source, resolveGrammar('python'), (scope, start, end) => { … });
```

## Bundle size

Bundled with Rolldown, minified, gzipped. Entry points *call* the API rather than
re-exporting it, so tree-shaking runs the way it does in a real app.

| Bundle | Gzipped |
| --- | ---: |
| `@scalar/highlight` core | 3.50 KB |
| …+ Python | 5.44 KB |
| …lazy loader, initial chunk | 5.05 KB |
| …`style.css` | 1.26 KB |

Per language, on top of the core: `diff` 0.21 KB · `json` 0.29 KB · `html` 0.53 KB · `http` 0.67 KB · `nginx` 0.69 KB · `ini` 0.70 KB · `graphql` 0.73 KB · `css` 0.79 KB · `yaml` 0.82 KB · `rust` 0.88 KB · `go` 0.90 KB · `makefile` 0.90 KB · `markdown` 0.91 KB · `dockerfile` 0.95 KB · `bash` 1.03 KB · `sql` 1.11 KB · `java` 1.15 KB · `dart` 1.17 KB · `lua` 1.19 KB · `r` 1.28 KB · `c` 1.31 KB · `clojure` 1.32 KB · `scala` 1.36 KB · `julia` 1.37 KB · `elixir` 1.38 KB · `kotlin` 1.38 KB · `powershell` 1.38 KB · `matlab` 1.43 KB · `objectivec` 1.43 KB · `swift` 1.44 KB · `ocaml` 1.45 KB · `haskell` 1.50 KB · `csharp` 1.52 KB · `mojo` 1.54 KB · `fsharp` 1.68 KB · `python` 1.71 KB · `ruby` 1.74 KB · `cpp` 1.78 KB · `perl` 1.87 KB · `php` 2.01 KB · `javascript` 2.11 KB.

Reproduce with `pnpm size`.

## How it works

A grammar is a small **state machine**, and each state is compiled to **one merged regular
expression**.

```js
{
  match: '\\b(def)([ \\t]+)(\\w+)([ \\t]*)(\\()',
  scope: ['keyword.declaration', null, 'function', null, 'punctuation.bracket'],
  push: 'params',
}
```

Three decisions follow from that shape and explain most of the performance:

**States describe only what is interesting.** Anything a state does not match is emitted
with that state's `default` scope. A string state needs three rules — escape,
interpolation, closing quote — not a rule for "string content". Sparse grammars are why
each language is around a kilobyte.

**One `exec` finds the next token.** Rules are merged into a single ordered alternation, so
the regex engine skips plain text in native code instead of a JavaScript loop trying
patterns at every position. Rule order is priority order, exactly as alternation already
works.

**Capture offsets are resolved off the hot path.** Scoping capture groups needs the `d`
flag, which makes the engine compute offsets for *every* group on *every* match — measured
at ~40% of scan throughput. Instead the merged regex runs without `d`, and the handful of
rules that need offsets re-run their own small sticky pattern at the position that already
matched.

Rendering streams: `tokenize` hands ranges to a callback, and the HTML renderer
concatenates directly from the source string. No token objects are allocated, adjacent
ranges sharing a scope merge into one span, and unscoped text is written bare.

## Scopes and styling

Grammars emit scopes from a [fixed vocabulary](src/core/scopes.ts) — `keyword.control`,
`string.escape`, `variable.parameter`, and so on. Each maps to a short class
(`<span class="shl-kd">def</span>`), and [`style.css`](src/style.css) points those
classes at fourteen semantic slots:

```css
/* the entire theming surface, per token kind */
.shl-code .shl-s { color: var(--scalar-hl-string); }

/* recolor every string in the app, in one line */
.shl-code { --scalar-hl-string: var(--scalar-color-purple); }
```

Because the color lives in a variable that `@scalar/themes` already swaps, changing theme
is a class change on a container. The HTML never moves — which also means a page can be
rendered once at build time and still respect a runtime theme toggle.

### About the `color-mix()`

Scalar's semantic palette is tuned for UI — badges, labels, large text — and several hues
are too light for 13px code on a light background. Against `--scalar-background-2` the
default theme's light values give yellow 1.6:1, accent 2.8:1 and orange 2.9:1, where WCAG
AA wants 4.5:1.

So each hue is pulled toward `--scalar-color-1`, the theme's own text color. That preserves
the hue's identity — a custom theme's green still drives strings — while guaranteeing it
moves toward whatever contrasts with that theme's background. `src/style.test.ts`
recomputes every resolved color in oklab and fails if one drops below AA, so the guarantee
stays checked rather than checked once.

`--scalar-hl-punctuation` is the one deliberate exception, held to the 3:1 non-text bar.
Brackets and commas are structural; lifting them to 4.5:1 would make them as loud as the
code they punctuate.

## Adding a language

A grammar is plain data with no imports beyond its type:

```ts
import type { Grammar } from '@scalar/highlight/core';

const toml: Grammar = {
  name: 'toml',
  aliases: ['tml'],
  states: {
    root: {
      rules: [
        { match: '#[^\\n]*', scope: 'comment' },
        { match: '^\\[[^\\]]+\\]', scope: 'namespace' },
        { match: '(\\w+)(\\s*)(=)', scope: ['property', null, 'operator'] },
        { match: '"', scope: 'string', push: 'string' },
      ],
    },
    string: {
      default: 'string',
      rules: [
        { match: '\\\\.', scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
  },
};
```

Rules may `push`, `pop` or `set` states, and `{ include: 'other-state' }` splices another
state's rules in at that position, keeping priority order. The compiler rejects unknown
state names, circular includes, backreferences (group numbers shift when rules merge) and
scope arrays longer than the pattern's capture count — all at compile time, not mid-tokenize
on a rare branch.

What a backreference would do, `remember` does across states: a rule that enters a state
can remember one of its capture groups, and that state's patterns match it again with
`{{remembered}}`. A heredoc closes only on its own marker, a raw string only on the run of
quotes that opened it, a YAML block scalar at the first line indented no further than its key:

```ts
{ match: '<<(\\w+)', scope: 'string.special', push: 'heredoc', remember: 1 },
// …
heredoc: {
  default: 'string',
  rules: [{ match: '^{{remembered}}$', scope: 'string.special', pop: true }],
},
```

A state can also hand its body to another language: `embed: { language: 'javascript',
until: '</script' }` tokenizes everything up to `</script` with the JavaScript grammar, if
it is registered, and leaves the closing tag to the state below. The HTML grammar does this
for `<script>` and `<style>` without importing either grammar. `language` can also be
`REMEMBERED`, which embeds whatever language the entering rule remembered: that is how a
Markdown fence such as ` ```ts ` highlights its body as TypeScript. `holes` marks regions of
the body that belong to the host grammar instead: the embedded language reads across them
as if each were a name, so its state carries over, and the host grammar tokenizes each hole.
A PHP template's `<script>` uses it for `<?= $x ?>`, which keeps `"<?= $name ?>"` one string.
Hole patterns may contain capture groups. An end marker inside a hole does not close the embedded body.

Lines end at `\n` (or `\r\n`) and nowhere else: the compiler rewrites `$` and `.` so a lone
`\r` or a U+2028 inside a string literal cannot end it early, as JavaScript's `m` flag would.

The test suite asserts, for every language and every sample, that emitted tokens
reconstruct the source exactly, that scopes come from the shared vocabulary, and that
tokenizing every truncated prefix terminates and stays consistent — which is what an editor
does on every keystroke.

## Migrating from `@scalar/code-highlight`

`@scalar/code-highlight` is deprecated and no longer in this repository. It was two packages
wearing one name, and each half has a new home:

| export | now |
| --- | --- |
| `syntaxHighlight`, `standardLanguages`, `lowlightLanguageMappings` | `@scalar/highlight/compat` |
| `css/code.css` | `@scalar/highlight/compat/code.css` |
| `htmlFromMarkdown`, `getHeadings`, `splitContent`, `isHeading`, `textFromNode` | [`@scalar/markdown`](https://github.com/scalar/scalar/tree/main/packages/markdown) |
| `rehypeHighlight`, `rehypeAlert` | [`@scalar/markdown`](https://github.com/scalar/scalar/tree/main/packages/markdown) |
| `basicLanguages`, `jsonYamlLanguages` | **removed** — grammars are registered, not passed in |

`@scalar/highlight/compat` is a drop-in `syntaxHighlight`. Same signature, same
`<pre><code class="hljs language-x">` envelope, same `hljs-*` token classes — so
[`code.css`](src/compat/code.css) styles it unchanged:

```diff
-import { standardLanguages, syntaxHighlight } from '@scalar/code-highlight';
-import '@scalar/code-highlight/css/code.css';
+import { languages, registerLanguage } from '@scalar/highlight/all';
+import { standardLanguages, syntaxHighlight } from '@scalar/highlight/compat';
+import '@scalar/highlight/compat/code.css';
+
+registerLanguage(...languages);
```

`standardLanguages` is re-exported with the same key set, so `StandardLanguageKey` is
unchanged and the component's props keep their types. The `languages` option is accepted
and ignored, since the registry already knows every grammar.

The one `standardLanguages` name with no grammar — `plaintext` — renders as escaped,
unhighlighted code, which is exactly what the lowlight pipeline did for a language it could
not resolve. `curl` has a grammar of its own that mirrors the bespoke one the old package
shipped.

### Verifying it

[`src/compat/compat.test.ts`](src/compat/compat.test.ts) compares ours against what the
lowlight pipeline rendered for the shared sample corpus, and asserts that the rendered text,
the `<code>` envelope and the line elements match exactly. It also ports the four
assertions `@scalar/code-highlight` shipped. The lowlight output was captured from the last
version of that package into [`test/reference.json`](test/reference.json) before it was
deleted, so it cannot be regenerated; [`test/reference.ts`](test/reference.ts) explains what
to do when a sample changes.

Colour is the part that does *not* match exactly, and `pnpm compat:report --detail`
quantifies it: across the whole corpus 68.4% of visible characters keep the colour
`code.css` gives them, and 82% across the thirteen languages the corpus started with. The
rest is our finer scope vocabulary showing through — f-string interiors scoped as code
rather than string, docstrings as comments rather than strings, punctuation given its own
scope — and it is widest where highlight.js scopes least, as on `http`, where it leaves
header values, `#` comments and status numbers unstyled. Each round of grammars keeps its
own floor — the whole corpus, the twenty-six samples before the latest round, and the
original thirteen — so a new language cannot dilute a regression in an older one.

For the same three languages `ScalarCodeBlock` shows most often, measured before the old
package was removed:

| | gzipped |
| --- | ---: |
| `@scalar/code-highlight` | 127.58 KB |
| `@scalar/highlight/compat` | 7.67 KB |

## Trade-offs

**It emits more markup.** Punctuation, operators and brackets get their own scopes rather
than inheriting the foreground, which is roughly 45% of the spans. That is the deliberate
cost of the way it looks. If you want it back, drop the punctuation rules from a grammar —
it is data.

**Hand-written grammars are approximations.** A tokenizer built on real TextMate grammars
will get things right on unusual syntax that these do not. The trade is startup cost and
bundle weight, and this library sits at the small end of it.

**Python's heuristics are heuristics.** Keyword arguments are told from assignments by PEP 8
spacing (`f(x=1)` versus `x = 1`); a triple-quoted string at the start of a line is treated
as a docstring; `CapWords` reads as a type and `SCREAMING_CASE` as a constant. These are
right on ordinary code and wrong on code written to defeat them.

**Embedding needs the embedded language registered.** Some grammars hand part of their input
to another grammar, when that one is registered:

- `<script>` and `<style>` bodies in HTML (and so in XML, SVG and Vue) and in PHP templates go
  to JavaScript and CSS.
- A Markdown fence goes to the language it names, front matter to YAML, and HTML at the start
  of a line to HTML.
- An HTTP body that starts with `<` goes to HTML.

When the grammar is not registered, the body is a plain string or unscoped text. A fence of four
or more backticks stays a plain string either way, so a block that shows ` ``` ` inside it
keeps closing on its own run. HTML in Markdown takes its line, or a `<script>`, `<pre>` or
`<style>` block to its closing tag, rather than running to the next blank line as CommonMark
says: MDX and most docs renderers read Markdown inside components.

**No automatic language detection.** Pass a language name. Detection means shipping every
grammar, which is the thing this library exists to avoid.

## Development

From the repository root:

```bash
pnpm install
pnpm vitest packages/highlight --run       # the suite
pnpm --filter @scalar/highlight build      # tsc, plus a copy of both stylesheets
pnpm --filter @scalar/highlight types:check
```

From this directory:

```bash
pnpm bench          # throughput per language, for comparing a branch against main
pnpm size           # bundle size per entry point and per language
pnpm compat:report  # colour drift against the old lowlight output; --detail for the breakdown
```

The published package ships zero runtime dependencies. `rolldown` measures bundle size; it
is a devDependency and never reaches consumers.

Repository-wide conventions live in the root [`AGENTS.md`](../../AGENTS.md).

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
