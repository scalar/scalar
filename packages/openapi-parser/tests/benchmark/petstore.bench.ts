import { bench, describe } from 'vitest'

import specification from './examples/petstore.json'
import { resolveNew } from './utils/resolveNew.ts'
import { resolveOld } from './utils/resolveOld.ts'

describe('petstore', () => {
  bench('@apidevtools/swagger-parser', async () => {
    // Action!
    await resolveOld(specification)
  })

  bench('@scalar/openapi-parser', async () => {
    // Action!
    await resolveNew(specification)
  })
})
