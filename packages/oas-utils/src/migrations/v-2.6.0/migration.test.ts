import { describe, expect, expectTypeOf, it } from 'vitest'

import type { v_2_5_0 } from '../v-2.5.0/types.generated'
import { migrate_v_2_6_0 } from '../v-2.6.0/migration'
import type { v_2_6_0 } from './types.generated'

describe('migrate_v_2_5_0', () => {
  it('should add selectedExampleUid if it was not present', () => {
    const mockRequest: v_2_5_0.Request = {
      uid: 'request1',
      type: 'request',
      path: '/users',
      method: 'get',
      examples: ['example1'],
      servers: [],
      selectedSecuritySchemeUids: [],
      selectedServerUid: '',
    }

    const mockData: v_2_5_0.DataRecord = {
      requests: {
        request1: mockRequest,
      },
      servers: {},
      collections: {},
      cookies: {},
      environments: {},
      requestExamples: {},
      securitySchemes: {},
      tags: {},
      workspaces: {},
    }

    const result = migrate_v_2_6_0(mockData)

    expect(result.requests.request1.selectedExampleUid).toBe('example1')
  })

  it('should preserve all other data properties', () => {
    const mockData: v_2_5_0.DataRecord = {
      requests: {},
      servers: {},
      collections: {},
      cookies: {},
      environments: {},
      requestExamples: {},
      securitySchemes: {},
      tags: {},
      workspaces: {},
    }

    const result = migrate_v_2_6_0(mockData)

    expectTypeOf(result).toMatchTypeOf<v_2_6_0.DataRecord>()
    expect(result.requests).toEqual(mockData.requests)
    expect(result.servers).toEqual(mockData.servers)
  })
})
