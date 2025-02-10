import type { Collection } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { isGettingStarted } from './getting-started'

describe('gettingStarted', () => {
  const mockRequests = {
    request1: { summary: 'My First Request' },
    request2: { summary: 'Another Request' },
  }

  const createCollection = (
    uid: string,
    title: string,
    requests: string[],
  ): Collection => ({
    uid,
    'info': { title, version: '1.0.0' },
    requests,
    'type': 'collection',
    'children': [],
    'openapi': '',
    'security': [],
    'x-scalar-icon': '',
    'securitySchemes': [],
    'selectedSecuritySchemeUids': [],
    'selectedServerUid': '',
    'servers': [],
    'tags': [],
    'watchMode': false,
    'watchModeStatus': 'IDLE',
  })

  const draftCollection = createCollection('drafts', 'Drafts', ['request1'])
  const anotherCollection = createCollection(
    'anotherCollection',
    'Another Collection',
    ['request2'],
  )

  it('should return true for a single draft request that is not renamed', () => {
    const result = isGettingStarted(
      [draftCollection],
      ['request1'],
      mockRequests,
    )
    expect(result).toBe(true)
  })

  it('should return false for a single draft request that is renamed', () => {
    const renamedRequests = {
      ...mockRequests,
      request1: { summary: 'Renamed Request' },
    }
    const result = isGettingStarted(
      [draftCollection],
      ['request1'],
      renamedRequests,
    )
    expect(result).toBe(false)
  })

  it('should return false if there are multiple requests', () => {
    const result = isGettingStarted(
      [draftCollection],
      ['request1', 'request2'],
      mockRequests,
    )
    expect(result).toBe(false)
  })

  it('should return false if the request is not in the drafts collection', () => {
    const result = isGettingStarted(
      [anotherCollection],
      ['request2'],
      mockRequests,
    )
    expect(result).toBe(false)
  })
})
