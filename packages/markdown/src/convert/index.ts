/**
 * Markdown to mdast, HTML to mdast and mdast to Markdown, for the Copy as Markdown packages.
 * They reuse the rendering pipeline's parser and tokenizer, so converting needs no second
 * Markdown or HTML parser.
 *
 * The folder is deliberately not called `mdast`. `tsc-alias` resolves bare imports against
 * `dist/`, so a `dist/mdast` folder turned every `from 'mdast'` in the emitted declarations into
 * `from '../mdast'`, and the mdast types (`Node`, `Root`) silently became `any` for every consumer.
 */
export { mdastFromHtml } from './mdast-from-html'
export { parseMarkdown } from './parse-markdown'
export { type MarkdownSerializerOptions, createMarkdownSerializer } from './to-markdown'
