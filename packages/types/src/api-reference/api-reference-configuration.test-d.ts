import { assertType, describe, it } from 'vitest'

import type { ApiReferenceConfiguration } from './api-reference-configuration'

describe('defaultHttpClient', () => {
  it('accepts a target with one of its client ids', () => {
    assertType<ApiReferenceConfiguration['defaultHttpClient']>({
      targetKey: 'node',
      clientKey: 'fetch',
    })
  })

  it('rejects the display title used as a client id', () => {
    assertType<ApiReferenceConfiguration['defaultHttpClient']>({
      targetKey: 'node',
      // @ts-expect-error the client id is lowercase 'fetch', not the title 'Fetch'
      clientKey: 'Fetch',
    })
  })

  it('rejects an unknown client id', () => {
    assertType<ApiReferenceConfiguration['defaultHttpClient']>({
      targetKey: 'node',
      // @ts-expect-error 'not-a-client' is not a known client id
      clientKey: 'not-a-client',
    })
  })
})
