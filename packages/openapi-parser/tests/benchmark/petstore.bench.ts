import { describe, it } from 'vitest'

import specification from './examples/petstore.json'
import { resolveNew } from './utils/resolveNew'
import { resolveOld } from './utils/resolveOld'

describe('petstore', () => {
  it('compares reference resolution', async ({ bench }) => {
    await bench.compare(
      bench('@apidevtools/swagger-parser', async () => {
        // Action!
        await resolveOld(specification)
      }),
      bench('@scalar/openapi-parser', () => {
        // Action!
        resolveNew(specification)
      }),
    )
  })
})
