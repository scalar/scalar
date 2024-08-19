import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/pass/${filename}`

describe('comp_pathitems', () => {
  it('passes', async () => {
    const comp_pathitems = await downloadFileToMemory(
      bucketName,
      filePath('comp_pathitems.yaml'),
    )
    const result = await validate(comp_pathitems)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})
