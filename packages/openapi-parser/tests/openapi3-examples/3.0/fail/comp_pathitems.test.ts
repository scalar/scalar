import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('comp_pathitems', () => {
  it('returns an error', async () => {
    const comp_pathitems = await downloadFileToMemory(
      bucketName,
      filePath('comp_pathitems.yaml'),
    )
    const result = await validate(comp_pathitems)

    // TODO: Should probably complain about the pathItems?
    expect(result.errors?.[0]?.message).toBe(
      `must have required property 'paths'`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
