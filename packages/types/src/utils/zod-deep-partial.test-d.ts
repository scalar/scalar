import { securitySchemeSchema } from '@/entities/security-scheme.ts'
import { assertType, describe, it } from 'vitest'
import type { z } from 'zod'
import { zodDeepPartial } from './zod-deep-partial.ts'

const partialSecuritySchemeSchema = zodDeepPartial(securitySchemeSchema)
type PartialSecuritySchemeSchema = z.infer<typeof partialSecuritySchemeSchema>

describe('zodDeepPartial', () => {
  it('ensure we are generating correct types for securitySchemes', () => {
    assertType<PartialSecuritySchemeSchema>({
      type: 'oauth2',
      flows: {
        implicit: { type: 'implicit', scopes: { 'read:items': 'Read access to items' } },
      },
    })

    assertType<PartialSecuritySchemeSchema>({
      type: 'oauth2',
      flows: {
        password: { type: 'password' },
      },
    })
  })
})
