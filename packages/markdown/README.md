# @scalar/markdown

[![Version](https://img.shields.io/npm/v/%40scalar/markdown)](https://www.npmjs.com/package/@scalar/markdown)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/markdown)](https://www.npmjs.com/package/@scalar/markdown)
[![License](https://img.shields.io/npm/l/%40scalar%2Fmarkdown)](https://www.npmjs.com/package/@scalar/markdown)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Markdown to HTML for Scalar projects: GitHub Flavored Markdown, GitHub alerts, sanitizing, and syntax highlighting through [`@scalar/highlight`](https://github.com/scalar/scalar/tree/main/packages/highlight).

It replaces the Markdown half of `@scalar/code-highlight`. The code half's replacement is `@scalar/highlight/compat`.

## Installation

```bash
npm install @scalar/markdown
```

## Usage

```ts
import { htmlFromMarkdown } from '@scalar/markdown'

const html = htmlFromMarkdown('# Hello\n\n```js\nconst answer = 42\n```')
```

Code blocks come out with the same `hljs` / `hljs-*` classes highlight.js uses, so style them with the stylesheet `@scalar/highlight` ships:

```ts
import '@scalar/highlight/compat/code.css'
```

A fence without a language is left as plain text. There is no language detection, because guessing wrong is worse than not colouring at all.

### How it renders

`htmlFromMarkdown`, `getHeadings` and `splitContent` run on a purpose-built CommonMark and GitHub Flavored Markdown parser (ported from commonmark.js) instead of unified, remark and rehype. Raw HTML goes through an allowlist writer that re-serializes every tag, so no HTML parser ships either. The tree is shaped like mdast, so `transform` callbacks written for remark keep working.

The output has the same DOM as the unified pipeline, but it is not formatted: there is no indentation and no leading or trailing newline.

The unified renderer is still available as `createHtmlFromMarkdown` from `@scalar/markdown/renderer`, for packages that bring their own rehype highlighter. See [`explorations/markdown-pipeline`](https://github.com/scalar/scalar/tree/main/explorations/markdown-pipeline) for how the two compare on size, speed, parity and safety.

### Other exports

| export | purpose |
| --- | --- |
| `htmlFromMarkdown` | Markdown string to sanitized HTML |
| `getHeadings` | Every heading in a Markdown string, with its depth |
| `splitContent` | Split a Markdown string into one document per heading |
| `isHeading`, `textFromNode` | Helpers for `transform` callbacks |
| `rehypeAlert` | rehype plugin for GitHub alerts (`> [!NOTE]`) |
| `rehypeHighlight` | rehype plugin for syntax highlighting |
| `parseMarkdown` | GitHub Flavored Markdown string to an mdast tree |
| `mdastFromHtml` | HTML fragment (such as `htmlFromMarkdown` output) to a sanitized mdast tree |
| `createMarkdownSerializer` | Build a reusable mdast to GitHub Flavored Markdown serializer |

### Converting Markdown

`parseMarkdown`, `mdastFromHtml` and `createMarkdownSerializer` are what `@scalar/openapi-to-markdown` and `@scalar/asyncapi-to-markdown` build "Copy as Markdown" with. They use no unified, remark, rehype or parse5 either:

- `parseMarkdown` is the renderer's own parser, returning standard mdast without `position`. It resolves reference-style links while it parses, so the tree has `link` nodes where remark would have `linkReference` and `definition` nodes. Footnotes keep their `footnoteReference` and `footnoteDefinition` nodes.
- `mdastFromHtml` sanitizes its input with the renderer's allowlist, builds a tree with the renderer's HTML tokenizer, and converts it as `rehype-remark` does. It is meant for HTML that `htmlFromMarkdown` wrote: other HTML is made safe, but only parsed as well as a stack of open elements can.
- `createMarkdownSerializer` is a port of `mdast-util-to-markdown` and its GFM extensions (tables, strikethrough, task lists, footnotes, autolink literals), with `remark-stringify`'s defaults. It takes the `bullet` and `join` options and handles the nodes those two packages build and parse. It throws on any other node, such as `image`, `definition` or `linkReference`, rather than writing something it was not checked for. Its escaping is the same as upstream's, so text never turns into raw HTML, emphasis or links, with one exception that remark shares: GFM finds autolink literals in decoded text, so text such as `www.example.com` comes back as a link to itself.

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
