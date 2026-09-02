import type { AnyObject } from '@scalar/types/utils'
import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import schemaProperties from './schemaProperties.yaml?raw'

describe('schemaProperties', () => {
  it('returns an error', async () => {
    const { valid, errors, schema } = await validate(schemaProperties)
    const parsedSchema = schema as AnyObject | undefined

    expect(parsedSchema?.components?.schemas?.SomeObject).not.toBe(undefined)

    expect(errors).not.toBe(undefined)
    expect(errors).not.toStrictEqual([])
    expect(errors[0]?.message).toBe("Can't resolve external reference: ../resources/myobject.yml")
    expect(errors.length).toBe(1)
    expect(valid).toBe(false)
  })
})
