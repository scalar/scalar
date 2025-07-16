import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBlockProps } from './useBlockProps'
import { collectionSchema } from '@scalar/oas-utils/entities/spec'

// Spy on unescapeJsonPointer instead of mocking it
const unescapeJsonPointerSpy = vi.spyOn(await import('@scalar/openapi-parser'), 'unescapeJsonPointer')

describe('useBlockProps', () => {
  // Mock store data
  const mockStore = {
    collections: {
      collection1: { id: 'collection1', name: 'Collection 1' },
    },
    requests: {
      request1: { uid: 'request1', method: 'get', path: '/planets/{planetId}' },
      request2: { uid: 'request2', method: 'post', path: '/planets' },
      request3: { uid: 'request3', method: 'get', path: '/stars' },
    },
  }

  // Mock collection
  const mockCollection = collectionSchema.parse({
    id: 'collection1',
    name: 'Collection 1',
    requests: ['request1', 'request2'],
  })

  beforeEach(() => {
    vi.clearAllMocks()
    unescapeJsonPointerSpy.mockClear()
  })

  it('returns undefined when store is undefined', () => {
    const { operation } = useBlockProps({
      store: undefined,
      location: '#/paths/~1planets~1{planetId}/get',
      collection: mockCollection,
    })

    expect(operation.value).toBeUndefined()
  })

  it('returns undefined when store collections or requests are undefined', () => {
    const { operation } = useBlockProps({
      store: {} as any,
      location: '#/paths/~1planets~1{planetId}/get',
      collection: mockCollection,
    })

    expect(operation.value).toBeUndefined()
  })

  it('throws an error for invalid location format', () => {
    expect(() => {
      const { operation } = useBlockProps({
        store: mockStore as any,
        location: '#/invalid/location',
        collection: mockCollection,
      })
      // Force computed to evaluate
      operation.value
    }).toThrow(/Invalid location/)
  })

  it('finds the correct operation based on path and method', () => {
    const { operation } = useBlockProps({
      store: mockStore as any,
      location: '#/paths/~1planets~1{planetId}/get',
      collection: mockCollection,
    })

    expect(operation.value).toEqual(mockStore.requests.request1)
    expect(unescapeJsonPointerSpy).toHaveBeenCalledWith('~1planets~1{planetId}')
  })

  it('returns undefined when no matching operation is found', () => {
    const { operation } = useBlockProps({
      store: mockStore as any,
      location: '#/paths/~1nonexistent/get',
      collection: mockCollection,
    })

    expect(operation.value).toBeUndefined()
  })

  it('filters operations by collection requests', () => {
    const { operation } = useBlockProps({
      store: mockStore as any,
      location: '#/paths/~1stars/get',
      collection: mockCollection,
    })

    // request3 has the right path/method but is not in the collection
    expect(operation.value).toBeUndefined()
  })

  it('matches operations case-insensitively for HTTP methods', () => {
    const { operation } = useBlockProps({
      store: mockStore as any,
      location: '#/paths/~1planets~1{planetId}/GET',
      collection: mockCollection,
    })

    expect(operation.value).toEqual(mockStore.requests.request1)
  })
})
