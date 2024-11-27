import { assertType, describe, test } from 'vitest'

import type { ClientId, TargetId } from './types'

describe('TargetId', () => {
  test('has node as a target', () => {
    const target = 'node'

    assertType<TargetId>(target)
  })

  test('target doesn’t exist', () => {
    const target = 'foo'

    // @ts-expect-error target doesn’t exist
    assertType<TargetId>(target)
  })

  test('has undici as a client', () => {
    const client = 'undici'

    assertType<ClientId<'node'>>(client)
  })

  test('client doesn’t exist', () => {
    const client = 'does-not-exist'

    // @ts-expect-error client doesn’t exist
    assertType<ClientId<'node'>>(client)
  })

  test('client exists, but target doesn’t', () => {
    const client = 'undici'

    // @ts-expect-error client exists, but target doesn’t
    assertType<ClientId<'foobar'>>(client)
  })

  test('client does exist, but not for the given target', () => {
    const client = 'undici'

    // @ts-expect-error client does exist, but not for the given target
    assertType<ClientId<'shell'>>(client)
  })
})
