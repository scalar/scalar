import { xScalarEnvironmentsSchema } from '@/entities/spec/x-scalar-environments'
import { parseJsonOrYaml } from '@/helpers'
import { describe, expect, test } from 'vitest'

import baseDefinition from '../../spec-extentions/x-scalar-environments.yaml?raw'

describe('x-scalar-environments', () => {
  test('Handles spec definition', () => {
    const parsed = parseJsonOrYaml(baseDefinition)

    expect(
      xScalarEnvironmentsSchema.parse(parsed['x-scalar-environments']),
    ).toEqual(parsed['x-scalar-environments'])
  })
})
