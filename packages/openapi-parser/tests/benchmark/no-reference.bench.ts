import { bench, describe } from 'vitest'

import { resolveNew } from './utils/resolveNew'
import { resolveOld } from './utils/resolveOld'

describe('no reference', () => {
  const specification = {
    openapi: '3.1.0',
    info: {
      title: 'Hello World',
      version: '2.0.0',
    },
    paths: {},
  }

  bench('@apidevtools/swagger-parser', async () => {
    // Action!
    await resolveOld(specification)
  })

  bench('@scalar/openapi-parser', async () => {
    // Action!
    await resolveNew(specification)
  })
})
