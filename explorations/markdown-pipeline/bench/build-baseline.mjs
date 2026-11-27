import { readFileSync, rmSync, writeFileSync } from 'node:fs'

import { rolldown } from 'rolldown'

import {
  BASELINE,
  BASELINE_HIGHLIGHTED,
  BASELINE_HIGHLIGHTED_SRC,
  BASELINE_NO_REPARSE,
  BASELINE_SRC,
  OUT,
  UNIFIED_RENDERER,
} from './paths.mjs'

const build = async (input, file) => {
  const b = await rolldown({ input, platform: 'node', logLevel: 'silent' })
  await b.write({ file, format: 'es' })
  await b.close()
}

await build(BASELINE_SRC, BASELINE)
await build(BASELINE_HIGHLIGHTED_SRC, BASELINE_HIGHLIGHTED)

// The same pipeline without the step that re-parses raw HTML fragments for inline Markdown,
// to attribute differences to that step: where the prototype matches this build, it is the cause.
const source = readFileSync(UNIFIED_RENDERER, 'utf8')
if (!source.includes('.use(transformInlineMarkdownInRawHtml)')) throw new Error('re-parse step not found')
// Next to the original, so its relative imports and dependencies resolve the same way.
const variant = UNIFIED_RENDERER.replace(/markdown\.ts$/, '.markdown-no-reparse.ts')
const entry = `${OUT}baseline-no-reparse.ts`
writeFileSync(variant, source.replace('.use(transformInlineMarkdownInRawHtml)', ''))
writeFileSync(
  entry,
  `import { createHtmlFromMarkdown } from ${JSON.stringify(variant)}
export const htmlFromMarkdown = createHtmlFromMarkdown(() => () => undefined)
`,
)
try {
  await build(entry, BASELINE_NO_REPARSE)
} finally {
  rmSync(entry)
  rmSync(variant)
}
