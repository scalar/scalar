import { HERE } from './paths.mjs'
import { SINK, fmt, measure } from './size.mjs'

const cwd = HERE
for (const [n, src] of [
  ['marked', `import { marked } from 'marked'; ${SINK}(s) => marked.parse(s)`],
  [
    'markdown-it',
    `import MarkdownIt from 'markdown-it'; const md = new MarkdownIt({ html: true, linkify: true }); ${SINK}(s) => md.render(s)`,
  ],
  [
    'micromark + gfm (html out, no sanitizer)',
    `import { micromark } from 'micromark'; import { gfm, gfmHtml } from 'micromark-extension-gfm'; ${SINK}(s) => micromark(s, { allowDangerousHtml: true, extensions: [gfm()], htmlExtensions: [gfmHtml()] })`,
  ],
])
  console.log(fmt(await measure(n, src, { cwd })))
