import { assertType, describe, it } from 'vitest'

import type { ClientId, Plugin, TargetId } from './index'

describe('TargetId', () => {
  it('has node as a target', () => {
    const target = 'node'

    assertType<TargetId>(target)
  })

  it(`target doesn't exist`, () => {
    const target = 'foo'

    // @ts-expect-error target doesn't exist
    assertType<TargetId>(target)
  })

  it('has undici as a client', () => {
    const client = 'undici'

    assertType<ClientId<'node'>>(client)
  })

  it(`client doesn't exist`, () => {
    const client = 'does-not-exist'

    // @ts-expect-error client doesn't exist
    assertType<ClientId<'node'>>(client)
  })

  it(`client exists, but target doesn't`, () => {
    const client = 'undici'

    // @ts-expect-error client exists, but target doesn't
    assertType<ClientId<'foobar'>>(client)
  })

  it('client does exist, but not for the given target', () => {
    const client = 'undici'

    // @ts-expect-error client does exist, but not for the given target
    assertType<ClientId<'shell'>>(client)
  })
})

describe('Plugin', () => {
  it('allows a client that belongs to the target', () => {
    assertType<Plugin>({
      target: 'node',
      client: 'fetch',
      title: 'Fetch',
      generate: () => '',
    })
  })

  it('rejects a client from a different target', () => {
    // @ts-expect-error curl is a shell client, not a node client
    assertType<Plugin>({
      target: 'node',
      client: 'curl',
      title: 'cURL',
      generate: () => '',
    })
  })

  it('rejects a title used as a client id', () => {
    assertType<Plugin>({
      target: 'node',
      // @ts-expect-error the client id is lowercase 'fetch', not the title 'Fetch'
      client: 'Fetch',
      title: 'Fetch',
      generate: () => '',
    })
  })
})
