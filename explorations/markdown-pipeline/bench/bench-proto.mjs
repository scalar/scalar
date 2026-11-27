import { run } from './bench.mjs'
import { BASELINE, PROTOTYPE } from './paths.mjs'

const { htmlFromMarkdown } = await import(BASELINE)
const proto = await import(PROTOTYPE)
const { marked } = await import('marked')
const opts = { removeTags: ['img', 'picture'] }
run({
  current: (s) => htmlFromMarkdown(s, opts),
  prototype: (s) => proto.htmlFromMarkdown(s, opts),
  marked: (s) => marked.parse(s, { async: false }),
})
