import { collectionSchema, type Operation } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { isGettingStarted } from './getting-started'

describe('gettingStarted', () => {
  const mockRequests = {
    request1: { summary: 'My First Request' },
    request2: { summary: 'Another Request' },
  }

  const createCollection = (uid: string, title: string, requests: string[]) =>
    collectionSchema.parse({
      uid,
      'info': { title, version: '1.0.0' },
      requests,
      'type': 'collection',
      'watchMode': false,
      'watchModeStatus': 'IDLE',
    })

  const draftCollection = createCollection('drafts-uid', 'Drafts', ['request1'])
  const anotherCollection = createCollection('anotherCollection', 'Another Collection', ['request2'])

  const request1Uid = 'request1' as Operation['uid']
  const request2Uid = 'request2' as Operation['uid']

  it('should return true for a single draft request that is not renamed', () => {
    const result = isGettingStarted([draftCollection], [request1Uid], mockRequests)
    expect(result).toBe(true)
  })

  it('should return false for a single draft request that is renamed', () => {
    const renamedRequests = {
      ...mockRequests,
      request1: { summary: 'Renamed Request' },
    }
    const result = isGettingStarted([draftCollection], [request1Uid], renamedRequests)
    expect(result).toBe(false)
  })

  it('should return false if there are multiple requests', () => {
    const result = isGettingStarted([draftCollection], [request1Uid, request2Uid], mockRequests)
    expect(result).toBe(false)
  })

  it('should return false if the request is not in the drafts collection', () => {
    const result = isGettingStarted([anotherCollection], [request2Uid], mockRequests)
    expect(result).toBe(false)
  })
})
