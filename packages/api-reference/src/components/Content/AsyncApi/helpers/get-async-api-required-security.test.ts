import type { AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getAsyncApiRequiredSecurity } from './get-async-api-required-security'

const documentWith = (securitySchemes: Record<string, unknown>): AsyncApiDocument =>
  ({
    asyncapi: '3.0.0',
    info: { title: 'Streaming API', version: '1.0.0' },
    components: { securitySchemes },
  }) as unknown as AsyncApiDocument

describe('getAsyncApiRequiredSecurity', () => {
  it('collects OAuth scopes from the operation security', () => {
    const document = documentWith({ oauth2: { type: 'oauth2', flows: {} } })

    // Inline entry carrying the required scopes, matched to `components.securitySchemes.oauth2`.
    const operation = {
      action: 'receive',
      security: [{ type: 'oauth2', flows: {}, scopes: ['read:events', 'write:events'] }],
    } as unknown as AsyncApiOperationObject

    const result = getAsyncApiRequiredSecurity(document, operation)

    expect(result.state).toBe('required')
    expect(result.requirements).toHaveLength(1)
    expect(result.requirements[0]?.schemes[0]?.scopes).toEqual(['read:events', 'write:events'])
  })

  it('returns no requirements when the operation has no security', () => {
    const document = documentWith({})
    const operation = { action: 'receive' } as unknown as AsyncApiOperationObject

    const result = getAsyncApiRequiredSecurity(document, operation)

    expect(result.state).toBe('none')
    expect(result.requirements).toEqual([])
  })

  it('handles a missing operation', () => {
    const result = getAsyncApiRequiredSecurity(documentWith({}), null)

    expect(result.state).toBe('none')
    expect(result.requirements).toEqual([])
  })
})
