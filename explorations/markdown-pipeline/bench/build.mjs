/** Builds the pipeline, what the package ships, and the unified renderer into Node modules. */
import { rolldown } from 'rolldown'

import { PROTOTYPE, PROTOTYPE_SRC, SHIPPED, SHIPPED_SRC } from './paths.mjs'

const b = await rolldown({ input: PROTOTYPE_SRC, platform: 'node', logLevel: 'warn' })
await b.write({ file: PROTOTYPE, format: 'es' })
const s = await rolldown({ input: SHIPPED_SRC, platform: 'node', logLevel: 'warn' })
await s.write({ file: SHIPPED, format: 'es' })
await import('./build-baseline.mjs')
