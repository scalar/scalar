import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('schemaProperties', () => {
  it('returns an error', async () => {
    const schemaProperties = await downloadFileToMemory(
      bucketName,
      filePath('schemaProperties.yaml'),
    )
    const { valid, errors, schema } = await validate(schemaProperties)

    expect(schema?.components?.schemas?.SomeObject).not.toBe(undefined)

    expect(errors).not.toBe(undefined)
    expect(errors).not.toStrictEqual([])
    expect(errors[0]?.message).toBe(
      'Can’t resolve external reference: ../resources/myobject.yml',
    )
    expect(errors.length).toBe(1)
    expect(valid).toBe(false)
  })
})
