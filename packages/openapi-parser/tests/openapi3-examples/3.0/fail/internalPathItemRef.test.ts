import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
// import internalPathItemRef from './internalPathItemRef.yaml?raw'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('internalPathItemRef', () => {
  it.skip('returns an error', async () => {
    const internalPathItemRef = await downloadFileToMemory(
      bucketName,
      filePath('internalPathItemRef.yaml'),
    )

    const result = await validate(internalPathItemRef)

    console.log('result', result)

    // expect(result.errors?.[0]?.message).toBe(`Can’t resolve URI: #/paths/test2`)
    // expect(result.errors?.length).toBe(1)
    // expect(result.valid).toBe(false)
  })
})
