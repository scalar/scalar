# Markdown pipeline exploration

Can a purpose-built Markdown pipeline beat the unified/remark/rehype stack behind `htmlFromMarkdown` (`@scalar/code-highlight`, moving to `@scalar/markdown` in #10739) on **bundle size and speed**, without giving up rendering parity or safety?

**Yes.** The prototype in [`src/`](./src) is **8× smaller** and **25–40× faster** on real API descriptions, renders the **same DOM for 99.87%** of 11,224 real descriptions (the rest are bugs in the current pipeline), passes **more** of the CommonMark spec, and survived 300,000 fuzzed inputs with no sanitizer violation. It is also linear on cmark's pathological inputs, where the current pipeline takes up to **139 seconds**.

This is a prototype, not a drop-in yet. [What it would take](#what-it-would-take-to-ship) lists the remaining work.

## Results

All numbers below come from the scripts in [`bench/`](./bench). Speed numbers are for comparing runs on one machine, not for quoting.

### Bundle size

Bundled and minified with Rolldown, as Vite builds this repo. The highlighter is stubbed out on both sides, because `@scalar/highlight` is shared with `ScalarCodeBlock` either way.

| | minified | gzip | brotli |
| --- | ---: | ---: | ---: |
| current: `htmlFromMarkdown` | 331.9 KB | 102.7 KB | 85.0 KB |
| current: `htmlFromMarkdown` + `getHeadings` + `splitContent` | 339.5 KB | 104.8 KB | 86.8 KB |
| **prototype: same full API** | **37.2 KB** | **13.3 KB** | **12.0 KB** |
| for reference: marked (no sanitizer, no raw-HTML handling) | 34.3 KB | 10.5 KB | 9.6 KB |
| for reference: micromark + GFM, HTML out, no sanitizer | 72.8 KB | 19.9 KB | 17.6 KB |
| for reference: markdown-it | 90.2 KB | 44.9 KB | 36.5 KB |

Where the current 332 KB goes (`pnpm size:breakdown`): parse5 29%, micromark + GFM 24%, hast utilities and rehype plugins 16%, mdast utilities 16%, unified/vfile/unist 12%. parse5 is a complete HTML5 parser that is there only to handle raw HTML in descriptions.

### Speed

Every `description` in the Stripe and GitHub API descriptions, rendered the way `ScalarMarkdown` does (`removeTags: ['img', 'picture']`). "Slow path" excludes the plain one-line strings that both implementations short-circuit with the same `PLAIN_PARAGRAPH` check (58–65% of descriptions).

| input | current | prototype | marked |
| --- | ---: | ---: | ---: |
| Stripe, all 12,805 descriptions | 2,107 ms | 53 ms | 84 ms |
| GitHub, all 14,826 descriptions | 2,208 ms | 49 ms | 96 ms |
| Stripe slow path, 2,337 unique | 1,088 ms | 28 ms | 26 ms |
| GitHub slow path, 1,944 unique | 1,521 ms | 33 ms | 43 ms |

Rendering every description of a Stripe-sized API costs about **2 s of main-thread time today**, and about **50 ms** with the prototype.

### Adversarial input

cmark's pathological test cases, about 100 KB each (`pnpm pathological`):

| case | current | prototype |
| --- | ---: | ---: |
| mismatched `*a_` openers and closers | 138,847 ms | 65 ms |
| `[ (](` repeated | 71,852 ms | 64 ms |
| `[ a_` link openers and emphasis closers | 48,252 ms | 27 ms |
| unclosed `<!--` | 50,401 ms | 35 ms |
| nested `*a **a` strong/emphasis | 28,367 ms | 36 ms |
| 1,000 nested lists (1 MB) | 48,837 ms | 368 ms |
| 6,667 nested block quotes | stack overflow | 3 ms |

An API description is untrusted input, so today a hostile or merely broken one can freeze the page, or the server when rendering server-side. The prototype bounds this with the limits cmark uses: link-destination parentheses nest at most 32 deep (the spec allows a limit), containers nest at most 100 deep, inlines at most 64 deep, and failed searches for closing backticks and `-->` are remembered so they are not repeated.

### Rendering parity

`pnpm parity` renders every unique description (11,224) with both pipelines, parses both outputs with parse5, and compares the canonical DOM.

| corpus | identical DOM |
| --- | ---: |
| Stripe | 5,523 / 5,529 |
| GitHub | 5,574 / 5,583 |
| Galaxy | 112 / 112 |

Eight of the 15 differences are bugs in the **current** pipeline that the prototype does not have. The other seven only move whitespace around a `<br>`:

- **Lost spaces next to inline code.** Stripe's `<p>Creates a new <code>OnboardingLink</code> object … redirect_url …</p>` renders as "OnboardingLink**object**". The `_` in `redirect_url` triggers the inline-Markdown re-parse of raw `<p>` text, and that re-parse trims the text's leading space. Five Stripe descriptions are affected, for example "Issuing**Authorization**".
- **Alerts lose their content.** `> [!NOTE]` followed by a list renders an empty alert. Three GitHub descriptions lose their notes this way.
- The remaining seven differ only in whitespace next to a `<br>`, which renders the same.

A third bug turned up while probing: `<details><summary>**x**</summary>`, a blank line, then the body. The current pipeline closes `<details>` before the body, because it re-parses each raw HTML fragment on its own. The prototype keeps one open-element stack across the document, so the body stays inside.

### CommonMark and GFM conformance

`pnpm spec` and `pnpm spec:compare`, comparing normalized DOM as the spec's own test runner does:

| | current pipeline | prototype |
| --- | ---: | ---: |
| CommonMark 0.31.2 (652 examples) | 629 | **647** |
| GFM extension examples (24) | 22 | 22 |

No example passes on the current pipeline and fails on the prototype. The five CommonMark examples the prototype fails are bare URLs, which GFM autolinks on purpose (remark-gfm does the same). URLs are compared after percent-decoding, because the prototype leaves character references in URLs for the browser to decode rather than percent-encoding them; see [Entities](#how-it-works).

### Security

The prototype replaces parse5 + rehype-sanitize with its own tokenizer and writer, so this got the most scrutiny. `pnpm security` renders 132 hand-written vectors and 300,000 randomly assembled inputs (a bag of tags, attributes, entity encodings, Markdown syntax, comments, CDATA, foreign content and raw-text elements). For each one it parses the output with parse5, with scripting both on and off, and checks it against an **independent copy** of the allowlist:

- only allowlisted tags, all in the HTML namespace
- only allowlisted attributes, and no `on*` or `style`
- every `href`/`src`/`cite`/`longdesc`/`srcset` URL, **as the browser decodes it**, is relative or uses an allowed scheme
- `<input>` is always a disabled checkbox
- tags balance strictly, so server-rendered output cannot close its container
- re-parsing is a fixed point

**Result: no violations.** One gap was found and fixed during testing: `srcset` was not scheme-checked. Browsers never run script from image candidates, and the current pipeline passes `javascript:` through `srcset` too, so the prototype is now stricter than today.

The only remaining check that fails is "the browser builds exactly the tree the writer wrote". Raw `<table>` HTML with unexpected content (a `<div>` straight inside `<table>`, `<td>` without `<tr>`) gets foster-parented or gets implied `<tbody>`/`<tr>` from the browser's parser. Every element still passes the checks above. This is a fidelity gap, and it is safe because none of the allowlisted tags has a raw-text content model, so no rearrangement can turn text into markup.

An independent agent review of the sanitizer was cut off before it reproduced anything. Its leads (fast path, undecoded `href` in the external-link check, table parts, `noscript` under both scripting modes, `class` on generated elements) are covered by the vectors above. Before shipping, this still deserves a human security review and the existing XSS test suites (DOMPurify's, html5sec).

### The existing test suite

The current pipeline's own tests (`markdown.test.ts`, `getHeadings.test.ts`, `splitContent.test.ts`, `rehype-alert.test.ts`) are copied into [`test/`](./test) unchanged except for the import. 84 of 92 pass. The 8 failures are expected:

- 5 compare exact `rehype-format` whitespace (a leading `\n`, indentation) or `&#x3C;` against `&lt;`. The DOM is identical.
- 3 expect `hljs` classes. The prototype has a `highlight` hook, but no highlighter is wired in here.

## How it works

Five files, no runtime dependencies:

| file | what it does |
| --- | --- |
| [`blocks.ts`](./src/blocks.ts) | CommonMark's line-by-line block algorithm, ported from commonmark.js, plus GFM tables, task list items and footnote definitions |
| [`inline.ts`](./src/inline.ts) | Delimiter-run emphasis and the bracket algorithm from commonmark.js, plus GFM strikethrough, autolink literals and footnote calls |
| [`html.ts`](./src/html.ts) | A small HTML tokenizer, the `hast-util-sanitize` GitHub schema the current pipeline uses (plus Scalar's `class` rule), and the `Writer` |
| [`render.ts`](./src/render.ts) | The tree to HTML, including GitHub alerts and footnotes with the same markup as today |
| [`index.ts`](./src/index.ts) | `htmlFromMarkdown`, `getHeadings`, `splitContent`, `isHeading` and `textFromNode`, with today's signatures |

Four decisions account for most of the size and speed:

- **No intermediate HTML tree.** The parser produces mdast-shaped nodes, so `transform` callbacks such as heading anchors and `textFromNode` keep working. The renderer writes HTML straight from those nodes, with no hast, no parse5 and no unified/vfile.
- **Sanitizing is serialization.** Generated elements and raw HTML tokens all go through one `Writer`. It never copies markup through: it re-emits each tag from its own token, drops anything outside the allowlist, escapes text, and keeps **one open-element stack for the whole document**. That stack is what makes `<details>` opened in one HTML block and closed in another wrap the Markdown between them, and what guarantees balanced output. Safety does not depend on tokenizing input exactly like a browser, only on the output being unambiguous, which holds because none of the allowlisted tags has a raw-text content model.
- **Entities.** The 2,125-name HTML entity table is most of markdown-it's size. The prototype decodes numeric references and about 35 common names itself, and writes every other named reference through for the browser to decode. That gives the same DOM, because the browser decodes exactly as parse5 does today. The one place CommonMark and HTML disagree is an unknown name that starts with a legacy name (`&notit;` is literal in CommonMark, `¬it;` in HTML), and a 146-name list covers that case. Because named references are not decoded in URLs, any `&` before a URL's first `/`, `?` or `#` makes the URL unsafe. That is where `javascript&colon;` hides a scheme, and no legitimate URL puts one there.
- **`splitContent` slices the source by line** instead of re-serializing an AST, so no Markdown stringifier ships.

## What it would take to ship

In rough order:

1. **Wire in `@scalar/highlight`.** Pass a `highlight(code, lang)` that returns the highlighted HTML, and port the "guess only when it can be confirmed" detection from #10739's `rehypeHighlight`. The rest of `render.ts` already emits the `hljs language-x custom-scroll` classes.
2. **Decide on byte-for-byte compatibility.** Output is DOM-equivalent, not string-equal: there is no `rehype-format` indentation and no leading `\n`. Tests that compare exact strings (in this package and in snapshot tests elsewhere) need to compare DOM or be updated, and visual snapshots need a review pass. The three bugs above are intended fixes.
3. **Table insertion modes in the `Writer`.** Insert implied `<tbody>`/`<tr>` and move content that is not allowed inside a table out of it, so the browser builds exactly the written tree. This is fidelity only, about 50 lines.
4. **The standalone bundle needs one more step.** `@scalar/openapi-to-markdown` and `@scalar/asyncapi-to-markdown` (the "Copy as Markdown" buttons) use unified for Markdown→mdast, HTML→mdast (`rehype-remark`) and mdast→Markdown (`remark-stringify`). They are dynamic `import()`s, so ESM builds load them only on click and get the full saving right away. The standalone build is UMD, though, which inlines them, so unified, parse5 and micromark stay in `standalone.js` until those two packages move too. The prototype's mdast-shaped tree covers their Markdown→mdast step. HTML→Markdown needs its own small converter, or can stay lazy in a separate chunk if the standalone build moves to ESM.
5. **Security sign-off.** A human review of `html.ts`, the DOMPurify and html5sec vector suites, and the invariant fuzzer from `bench/` kept in CI.
6. **Packaging.** Make this the implementation inside `@scalar/markdown` (#10739) behind the same exports, and keep the remark-based version as the reference in its tests, the way `@scalar/highlight` freezes lowlight output. Then the usual: types, Knip, changesets.

Known gaps that did not show up in the corpus: GFM's `ftp://` autolink literal is not supported (micromark does not support it either), and `textFromNode` returns uncommon named references undecoded (`&eacute;` stays as written in heading text).

## Reproducing

From this directory (the repository root needs `pnpm install` first, because the baseline is built from `packages/code-highlight`):

```bash
pnpm install --ignore-workspace
pnpm setup             # download the corpora and the GFM spec, build both pipelines
pnpm test              # the current pipeline's own test suite against the prototype
pnpm spec              # CommonMark and GFM conformance
pnpm spec:compare      # the same, scored for both pipelines
pnpm parity            # DOM comparison over 11,224 real descriptions
pnpm size              # bundle size, both pipelines and the alternatives
pnpm bench             # throughput
pnpm security          # vectors plus 300,000 fuzzed inputs
pnpm pathological      # cmark's pathological inputs (the current pipeline takes minutes)
```

This directory is outside the pnpm workspace, so it does not affect the build, CI or releases.
