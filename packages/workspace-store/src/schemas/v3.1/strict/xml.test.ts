import { coerceValue } from '@/schemas/typebox-coerce'
import { XMLObjectSchema } from '@/schemas/v3.1/strict/xml'
import { describe, expect, it } from 'vitest'

describe('xml', () => {
  it('should safely return a xml object', () => {
    expect(coerceValue(XMLObjectSchema, {})).toEqual({})
  })
})
