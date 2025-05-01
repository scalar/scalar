import { describe, expect, expectTypeOf, it } from 'vitest'

import type { v_2_3_0 } from '../v-2.3.0/types.generated'
import { migrate_v_2_4_0 } from './migration'
import type { v_2_4_0 } from './types.generated'

describe('migrate_v_2_4_0', () => {
  it('should migrate draft collection by removing servers and updating request paths', () => {
    // Setup test data
    const mockServer: v_2_3_0.Server = {
      uid: 'server1',
      url: 'https://api.example.com',
      description: 'Test server',
    }

    const mockRequest: v_2_3_0.Request = {
      uid: 'request1',
      type: 'request',
      path: '/users',
      method: 'get',
      servers: ['server1'],
      selectedServerUid: 'server1',
      examples: [],
      selectedSecuritySchemeUids: [],
    }

    const mockDraftCollection: v_2_3_0.Collection = {
      'uid': 'draft1',
      'type': 'collection',
      'info': {
        title: 'Drafts',
        version: '1.0.0',
      },
      'openapi': '3.0.0',
      'security': [],
      'servers': ['server1'],
      'selectedServerUid': '',
      'securitySchemes': [],
      'selectedSecuritySchemeUids': [],
      'requests': ['request1'],
      'tags': [],
      'children': [],
      'watchMode': false,
      'watchModeStatus': 'IDLE',
      'x-scalar-icon': 'draft',
    }

    const mockData: v_2_3_0.DataRecord = {
      collections: {
        draft1: mockDraftCollection,
      },
      servers: {
        server1: mockServer,
      },
      requests: {
        request1: mockRequest,
      },
      cookies: {},
      environments: {},
      requestExamples: {},
      securitySchemes: {},
      tags: {},
      workspaces: {},
    }

    // Perform migration
    const result = migrate_v_2_4_0(mockData)

    // Assertions
    expectTypeOf(result).toMatchTypeOf<v_2_4_0.DataRecord>()
    expect(result.collections.draft1?.servers).toEqual([])
    expect(result.requests.request1?.path).toBe('https://api.example.com/users')
    expect(result.requests.request1?.selectedServerUid).toBe('')
  })

  it('should preserve all other data properties', () => {
    // Setup test data with all properties
    const mockData: v_2_3_0.DataRecord = {
      collections: {},
      cookies: {
        cookie1: {
          uid: 'cookie1',
          name: 'test',
          value: 'value',
          sameSite: 'Lax',
        },
      },
      environments: {
        env1: { uid: 'env1', name: 'test', color: 'blue', value: 'value' },
      },
      requestExamples: {},
      requests: {},
      securitySchemes: {},
      servers: {},
      tags: {},
      workspaces: {},
    }

    // Perform migration
    const result = migrate_v_2_4_0(mockData)

    // Assertions
    expect(result.cookies).toEqual(mockData.cookies)
    expect(result.environments).toEqual(mockData.environments)
    expect(result.collections).toEqual(mockData.collections)
  })
})
