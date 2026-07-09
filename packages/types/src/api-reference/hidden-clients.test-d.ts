import { assertType, describe, it } from 'vitest'

import type { ApiReferenceConfiguration } from './types'

type HiddenClients = ApiReferenceConfiguration['hiddenClients']

describe('hiddenClients', () => {
  it('accepts a list of targets, client names, and full ids', () => {
    assertType<HiddenClients>(['node', 'fetch', 'node/fetch'])
  })

  it('accepts the record form keyed by target', () => {
    assertType<HiddenClients>({ node: ['fetch', 'axios'], python: true })
  })

  it('accepts true to hide every client', () => {
    assertType<HiddenClients>(true)
  })

  it('rejects an unknown client name in the array', () => {
    // @ts-expect-error 'nope' is not a known client id
    assertType<HiddenClients>(['nope'])
  })

  it('rejects an unknown target key in the record', () => {
    // @ts-expect-error 'nope' is not a known target
    assertType<HiddenClients>({ nope: true })
  })
})
