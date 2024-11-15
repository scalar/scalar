import { xScalarSecretsSchema } from '@/entities/spec/x-scalar-secrets'
import { parseJsonOrYaml } from '@/helpers'
import { describe, expect, test } from 'vitest'

import baseDefinition from '../../spec-extentions/x-scalar-environments.yaml?raw'

describe('x-scalar-secrets', () => {
  test('Handles spec definition', () => {
    const parsed = parseJsonOrYaml(baseDefinition)

    expect(xScalarSecretsSchema.parse(parsed['x-scalar-secrets'])).toEqual(
      parsed['x-scalar-secrets'],
    )
  })
})
