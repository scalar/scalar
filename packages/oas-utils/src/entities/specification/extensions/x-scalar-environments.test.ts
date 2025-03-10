import { parseJsonOrYaml } from '@/helpers'
import { describe, expect, it } from 'vitest'
import { xScalarEnvironmentsSchema } from './x-scalar-environments'

import baseDefinition from './x-scalar-environments.yaml?raw'

describe('x-scalar-environments', () => {
  it('Handles spec definition', () => {
    const parsed = parseJsonOrYaml(baseDefinition)

    expect(xScalarEnvironmentsSchema.parse(parsed['x-scalar-environments'])).toEqual(parsed['x-scalar-environments'])
  })
})
