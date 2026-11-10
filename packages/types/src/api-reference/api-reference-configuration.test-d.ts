import { assertType, describe, it } from 'vitest'

import type { ApiReferenceConfiguration } from './api-reference-configuration'
import type { ApiReferenceConfiguration as PublicConfiguration } from './types'

describe('defaultHttpClient', () => {
  it('accepts custom samples in the public configuration type', () => {
    assertType<PublicConfiguration['defaultHttpClient']>({ targetKey: 'custom', clientKey: 'python' })
  })

  it('keeps public built-in client ids narrow', () => {
    assertType<PublicConfiguration['defaultHttpClient']>({
      targetKey: 'node',
      // @ts-expect-error Unknown client ids are only allowed for the custom target.
      clientKey: 'not-a-client',
    })
  })

  it('accepts a custom sample id', () => {
    assertType<ApiReferenceConfiguration['defaultHttpClient']>({
      targetKey: 'custom',
      clientKey: 'python/1',
    })
  })

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
