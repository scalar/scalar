import { xScalarEnvironmentsSchema } from '@/entities/spec/x-scalar-environments'
import { parseJsonOrYaml } from '@/helpers'
import { describe, expect, it } from 'vitest'

import baseDefinition from '../../spec-extentions/x-scalar-environments.yaml?raw'

describe('x-scalar-environments', () => {
  it('Handles spec definition', () => {
    const parsed = parseJsonOrYaml(baseDefinition)

    expect(xScalarEnvironmentsSchema.parse(parsed['x-scalar-environments'])).toEqual(parsed['x-scalar-environments'])
  })
})
