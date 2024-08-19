import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('hasFlowNotFlows', () => {
  it('returns an error', async () => {
    const hasFlowNotFlows = await downloadFileToMemory(
      bucketName,
      filePath('hasFlowNotFlows.json'),
    )
    const result = await validate(hasFlowNotFlows)

    // TODO: This should probably mention the incorrect security type?
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
