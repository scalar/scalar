# @scalar/markdown

[![Version](https://img.shields.io/npm/v/%40scalar/markdown)](https://www.npmjs.com/package/@scalar/markdown)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/markdown)](https://www.npmjs.com/package/@scalar/markdown)
[![License](https://img.shields.io/npm/l/%40scalar%2Fmarkdown)](https://www.npmjs.com/package/@scalar/markdown)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Markdown to HTML for Scalar projects: GitHub Flavored Markdown, GitHub alerts, sanitizing, and syntax highlighting through [`@scalar/highlight`](https://github.com/scalar/scalar/tree/main/packages/highlight).

This is the Markdown half of the former `@scalar/code-highlight`. The code half lives in `@scalar/highlight/compat`.

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

A fence without a language is left as plain text. There is no language detection.

### Other exports

| export | purpose |
| --- | --- |
| `htmlFromMarkdown` | Markdown string to sanitized HTML |
| `getHeadings` | Every heading in a Markdown string, with its depth |
| `splitContent` | Split a Markdown string into one document per heading |
| `isHeading`, `textFromNode` | Helpers for `transform` callbacks |
| `rehypeAlert` | rehype plugin for GitHub alerts (`> [!NOTE]`) |
| `rehypeHighlight` | rehype plugin for syntax highlighting |

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
