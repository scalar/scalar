import { describe, expect, it } from 'vitest'

import { parseJsonOrYaml } from '@/helpers/parse'
import baseDefinition from '@/spec-extentions/x-scalar-environments.yaml?raw'
import { xScalarSecretsSchema } from './x-scalar-secrets'

describe('x-scalar-secrets', () => {
  it('Handles spec definition', () => {
    const parsed = parseJsonOrYaml(baseDefinition)

    expect(xScalarSecretsSchema.parse(parsed['x-scalar-secrets'])).toEqual(parsed['x-scalar-secrets'])
  })
})
