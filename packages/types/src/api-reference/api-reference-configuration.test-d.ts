import { assertType, describe, it } from 'vitest'

import type { ApiReferenceConfiguration } from './api-reference-configuration'
import type { ApiReferenceConfiguration as PublicConfiguration } from './types'

describe('api-reference-configuration', () => {
  it('accepts exact client IDs and target wildcards in the public configuration', () => {
    assertType<PublicConfiguration['httpClients']>(['node/undici', 'shell/*'])
  })

  it('rejects partial client wildcards', () => {
    // @ts-expect-error Only an entire target can be included with a wildcard.
    assertType<PublicConfiguration['httpClients']>(['shell/cu*'])
  })

  it('accepts exact built-in and custom default client IDs', () => {
    assertType<PublicConfiguration['defaultHttpClient']>('node/fetch')
    assertType<ApiReferenceConfiguration['defaultHttpClient']>('custom/python/1')
  })

  it('rejects a target wildcard as the default client', () => {
    // @ts-expect-error A default client must identify a single code sample.
    assertType<PublicConfiguration['defaultHttpClient']>('shell/*')
  })
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
