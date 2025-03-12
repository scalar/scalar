import type { ReferenceConfiguration } from '@/legacy/reference-config.ts'
import { assertType, describe, it } from 'vitest'
import type { ApiReferenceConfiguration } from './api-reference-configuration.ts'

describe('ApiReferenceConfiguration', () => {
  it('has a type that is compatible with the legacy type', () => {
    assertType<ReferenceConfiguration>({} as ApiReferenceConfiguration)
  })
})
