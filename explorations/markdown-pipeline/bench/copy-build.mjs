/**
 * Builds the Copy as Markdown code with the unified converters it used before (`copy-baseline.ts`,
 * the old `packages/markdown/src/convert/convert.ts`), with the pipeline's, and with the old ones
 * plus the intended changes (`copy-shim-explained.ts`). Everything else, the two packages' own
 * code included, is the same source on every side.
 */
import { rolldown } from 'rolldown'

import { HERE, OUT, ROOT } from './paths.mjs'

const build = async (side) => {
  const shim = `${HERE}copy-shim-${side}.ts`
  const b = await rolldown({
    input: `${HERE}copy-entry.ts`,
    platform: 'node',
    logLevel: 'silent',
    resolve: {
      alias: {
        '@scalar/markdown': shim,
        // So the AsyncAPI package's descriptions go through the same shim.
        '@scalar/openapi-to-markdown/markdown': `${ROOT}packages/openapi-to-markdown/src/markdown/index.ts`,
      },
    },
  })
  await b.write({ file: `${OUT}copy-${side}.mjs`, format: 'es', codeSplitting: false })
  await b.close()
}

for (const side of ['old', 'new', 'explained']) await build(side)
console.log('built copy-old.mjs, copy-new.mjs and copy-explained.mjs in', OUT)
