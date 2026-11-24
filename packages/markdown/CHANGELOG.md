# @scalar/markdown

## 0.1.2

No changes in this release.

## 0.1.1

No changes in this release.

## 0.1.0

### Minor Changes

- [#11124](https://github.com/scalar/scalar/pull/11124): Add `@scalar/markdown`, a replacement for the Markdown half of `@scalar/code-highlight`

  `htmlFromMarkdown`, `getHeadings`, `splitContent`, `isHeading`, `textFromNode` and `rehypeAlert` move here unchanged in name and signature. `rehypeHighlight` keeps its name and its `className` option; the options that configured lowlight (`lowlight`, `languages`, `aliases`, `subset`, `plainText`, `prefix` and `detect`) have no equivalent. Code blocks are now highlighted by `@scalar/highlight` rather than lowlight, with the same `hljs` and `hljs-*` classes, so `code.css` keeps styling them.

  One behaviour changes: a fenced code block without a language is no longer auto-detected. highlight.js guessed a language for it, often wrongly. Now it renders as plain text, keeping the `hljs` class so it still looks like every other code block.
- [#11124](https://github.com/scalar/scalar/pull/11124): Share one copy of the Markdown parser stack

  `@scalar/markdown` adds `parseMarkdown`, `mdastFromHtml` and `createMarkdownSerializer`. `@scalar/openapi-to-markdown` and `@scalar/asyncapi-to-markdown` use them instead of importing `unified`, `remark-*` and `rehype-*` themselves. `@scalar/markdown` bundles that stack, so a bundle that included both used to carry two copies of parse5, micromark and the mdast/hast utilities; the API Reference standalone build is about 330 KB smaller, 99 KB gzipped. Sharing the stack does not change the Markdown either package produces.
