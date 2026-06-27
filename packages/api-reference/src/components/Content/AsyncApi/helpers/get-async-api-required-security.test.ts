import type { AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getAsyncApiRequiredSecurity } from './get-async-api-required-security'

const documentWith = (securitySchemes: Record<string, unknown>): AsyncApiDocument =>
  ({
    asyncapi: '3.0.0',
    info: { title: 'API', version: '1.0.0' },
    'x-scalar-original-document-hash': '',
    components: { securitySchemes },
  }) as unknown as AsyncApiDocument

describe('getAsyncApiRequiredSecurity', () => {
  it("reports state 'none' when the operation has no security", () => {
    const result = getAsyncApiRequiredSecurity(documentWith({}), { action: 'send' } as AsyncApiOperationObject)
    expect(result).toEqual({ state: 'none', requirements: [] })
  })

  it('reports state none for a null operation', () => {
    expect(getAsyncApiRequiredSecurity(documentWith({}), null)).toEqual({ state: 'none', requirements: [] })
  })

  it('maps a $ref security entry to a required scheme group', () => {
    const document = documentWith({ apiKey: { type: 'httpApiKey', name: 'X-Api-Key', in: 'header' } })
    const operation = {
      action: 'send',
      security: [{ $ref: '#/components/securitySchemes/apiKey' }],
    } as unknown as AsyncApiOperationObject

    const result = getAsyncApiRequiredSecurity(document, operation)

    expect(result.state).toBe('required')
    expect(result.requirements).toHaveLength(1)
    expect(result.requirements[0]?.schemes[0]?.name).toBe('apiKey')
    expect(result.requirements[0]?.schemes[0]?.scheme?.type).toBe('httpApiKey')
  })

  it('keeps oauth2 scopes from an inline security entry', () => {
    const document = documentWith({
      oauth: { type: 'oauth2', flows: {} },
    })
    const operation = {
      action: 'receive',
      security: [{ type: 'oauth2', flows: {}, scopes: ['read:users', ''] }],
    } as unknown as AsyncApiOperationObject

    const result = getAsyncApiRequiredSecurity(document, operation)

    expect(result.state).toBe('required')
    // Empty scope strings are filtered out.
    expect(result.requirements[0]?.schemes[0]?.scopes).toEqual(['read:users'])
  })
})
