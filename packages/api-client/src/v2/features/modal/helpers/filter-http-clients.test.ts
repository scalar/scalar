import type { AvailableClients } from '@scalar/types/snippetz'
import { describe, expect, it } from 'vitest'

import { filterHttpClients } from './filter-http-clients'

const clients: AvailableClients = ['node/fetch', 'node/undici', 'js/fetch', 'shell/curl', 'shell/httpie']

describe('filter-http-clients', () => {
  it('keeps the visible clients when the allowlist is omitted', () => {
    expect(filterHttpClients(clients)).toEqual(clients)
  })

  it('hides every client when the allowlist is empty', () => {
    expect(filterHttpClients(clients, [])).toEqual([])
  })

  it('matches exact IDs and target wildcards in catalog order without duplicates', () => {
    expect(filterHttpClients(clients, ['shell/*', 'shell/curl', 'node/fetch'])).toEqual([
      'node/fetch',
      'shell/curl',
      'shell/httpie',
    ])
  })

  it('ignores unknown patterns and cannot restore excluded clients', () => {
    expect(filterHttpClients(clients, ['unknown/*', 'fetch', 'node/f*', 'shell/wget'])).toEqual([])
  })
})
