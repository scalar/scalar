import { describe, expect, it } from 'vitest'

import { useBlockProps } from './useBlockProps'

describe('useBlockProps', () => {
  it('returns operation object with expected properties', () => {
    const mockStore = {
      collections: {
        collection1: {
          requests: ['req1'],
        },
      },
      requests: {
        req1: {
          uid: 'req1',
          method: 'get',
          path: 'test',
          description: 'Test endpoint',
        },
      },
    }

    const { operation } = useBlockProps({
      // @ts-expect-error
      store: mockStore,
      location: '#/paths/test/get',
    })

    expect(operation.value).toBeDefined()
    expect(operation.value).toEqual({
      uid: 'req1',
      method: 'get',
      path: 'test',
      description: 'Test endpoint',
    })
  })

  it('returns undefined when store is empty', () => {
    const { operation } = useBlockProps({
      // @ts-expect-error
      store: {},
      location: '#/paths/test/get',
    })

    expect(operation.value).toBeUndefined()
  })

  it('returns undefined when store has no collections', () => {
    const { operation } = useBlockProps({
      // @ts-expect-error
      store: { requests: {} },
      location: '#/paths/test/get',
    })

    expect(operation.value).toBeUndefined()
  })

  it('returns undefined when store has no requests', () => {
    const { operation } = useBlockProps({
      // @ts-expect-error
      store: { collections: {} },
      location: '#/paths/test/get',
    })

    expect(operation.value).toBeUndefined()
  })

  it('returns operation when method and path match location', () => {
    const mockStore = {
      collections: {
        collection1: {
          requests: ['req1'],
        },
      },
      requests: {
        req1: {
          uid: 'req1',
          method: 'get',
          path: 'test',
        },
      },
    }

    const { operation } = useBlockProps({
      // @ts-expect-error
      store: mockStore,
      location: '#/paths/test/get',
    })

    expect(operation.value).toEqual({
      uid: 'req1',
      method: 'get',
      path: 'test',
    })
  })

  it('returns undefined when method does not match', () => {
    const mockStore = {
      collections: {
        collection1: {
          requests: ['req1'],
        },
      },
      requests: {
        req1: {
          uid: 'req1',
          method: 'post',
          path: 'test',
        },
      },
    }

    const { operation } = useBlockProps({
      // @ts-expect-error
      store: mockStore,
      location: '#/paths/test/get',
    })

    expect(operation.value).toBeUndefined()
  })

  it('returns undefined when path does not match', () => {
    const mockStore = {
      collections: {
        collection1: {
          requests: ['req1'],
        },
      },
      requests: {
        req1: {
          uid: 'req1',
          method: 'get',
          path: 'other',
        },
      },
    }

    const { operation } = useBlockProps({
      // @ts-expect-error
      store: mockStore,
      location: '#/paths/test/get',
    })

    expect(operation.value).toBeUndefined()
  })

  it('handles escaped characters in path', () => {
    const mockStore = {
      collections: {
        collection1: {
          requests: ['req1'],
        },
      },
      requests: {
        req1: {
          uid: 'req1',
          method: 'get',
          path: 'test/with/slashes',
        },
      },
    }

    const { operation } = useBlockProps({
      // @ts-expect-error
      store: mockStore,
      location: '#/paths/test~1with~1slashes/get',
    })

    expect(operation.value).toEqual({
      uid: 'req1',
      method: 'get',
      path: 'test/with/slashes',
    })
  })

  it('returns undefined when request is not in collection', () => {
    const mockStore = {
      collections: {
        collection1: {
          requests: ['req2'], // Different request ID
        },
      },
      requests: {
        req1: {
          uid: 'req1',
          method: 'get',
          path: 'test',
        },
      },
    }

    const { operation } = useBlockProps({
      // @ts-expect-error
      store: mockStore,
      location: '#/paths/test/get',
    })

    expect(operation.value).toBeUndefined()
  })
})
