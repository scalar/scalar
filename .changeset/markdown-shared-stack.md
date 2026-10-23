---
'@scalar/markdown': minor
'@scalar/openapi-to-markdown': patch
'@scalar/asyncapi-to-markdown': patch
---

Share one copy of the Markdown parser stack

`@scalar/markdown` adds `parseMarkdown`, `mdastFromHtml` and `createMarkdownSerializer`. `@scalar/openapi-to-markdown` and `@scalar/asyncapi-to-markdown` use them instead of importing `unified`, `remark-*` and `rehype-*` themselves. `@scalar/markdown` bundles that stack, so a bundle that included both used to carry two copies of parse5, micromark and the mdast/hast utilities; the API Reference standalone build is about 330 KB smaller, 99 KB gzipped. The Markdown both packages produce is unchanged.
