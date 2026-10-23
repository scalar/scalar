/** Builds the prototype and the current pipeline (without a highlighter) into Node modules. */
import { rolldown } from 'rolldown'

import { PROTOTYPE, PROTOTYPE_SRC } from './paths.mjs'

const b = await rolldown({ input: PROTOTYPE_SRC, platform: 'node', logLevel: 'warn' })
await b.write({ file: PROTOTYPE, format: 'es' })
await import('./build-baseline.mjs')
