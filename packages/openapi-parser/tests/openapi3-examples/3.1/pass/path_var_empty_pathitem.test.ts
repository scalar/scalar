import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/pass/${filename}`

describe('path_var_empty_pathitem', () => {
  it('passes', async () => {
    const path_var_empty_pathitem = await downloadFileToMemory(
      bucketName,
      filePath('path_var_empty_pathitem.yaml'),
    )
    const result = await validate(path_var_empty_pathitem)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})
