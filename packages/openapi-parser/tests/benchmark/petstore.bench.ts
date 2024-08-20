import { bench, describe, expect } from 'vitest'

import { downloadFileToMemory } from '../utils/downloadFileGcp'
import { resolveNew } from './utils/resolveNew'
import { resolveOld } from './utils/resolveOld'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `${filename}`

const specification = (await downloadFileToMemory(
  bucketName,
  filePath('petstore.json'),
)) as any

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
