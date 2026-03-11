import { describe, expect, expectTypeOf, it } from 'vitest'

import type { v_2_4_0 } from '../v-2.4.0/types.generated'
import { migrate_v_2_5_0 } from './migration'
import type { v_2_5_0 } from './types.generated'

describe('migrate_v_2_5_0', () => {
  it('should add default "Accept" header if it does not exist', () => {
    // Setup test data
    const mockRequestExample: v_2_4_0.RequestExample = {
      type: 'requestExample',
      uid: 'example1',
      requestUid: 'request1',
      name: 'Example with no Accept header',
      body: {
        activeBody: 'raw',
      },
      parameters: {
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        path: [],
        query: [],
        cookies: [],
      },
    }

    // Perform migration
    const mockData: v_2_4_0.DataRecord = {
      requestExamples: { example1: mockRequestExample },
      collections: {},
      cookies: {},
      environments: {},
      requests: {},
      securitySchemes: {},
      servers: {},
      tags: {},
      workspaces: {},
    }

    // Perform migration
    const result = migrate_v_2_5_0(mockData)

    // Assertions
    expectTypeOf(result).toMatchTypeOf<v_2_5_0['DataRecord']>()
    expect(result.requestExamples.example1!.parameters.headers[0]!.key).toBe('Accept')
    expect(result.requestExamples.example1!.parameters.headers[0]!.value).toBe('*/*')
  })

  it('should not add "Accept" header if it already exists', () => {
    // Setup test data
    const mockRequestExample: v_2_4_0.RequestExample = {
      type: 'requestExample',
      uid: 'example2',
      requestUid: 'request2',
      name: 'Example with Accept header',
      body: {
        activeBody: 'raw',
      },
      parameters: {
        headers: [
          { key: 'Accept', value: 'application/json', enabled: true },
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        path: [],
        query: [],
        cookies: [],
      },
    }

    const mockData: v_2_4_0.DataRecord = {
      requestExamples: { example2: mockRequestExample },
      collections: {},
      cookies: {},
      environments: {},
      requests: {},
      securitySchemes: {},
      servers: {},
      tags: {},
      workspaces: {},
    }

    // Perform migration
    const result = migrate_v_2_5_0(mockData)

    // Assertions
    expectTypeOf(result).toMatchTypeOf<v_2_5_0['DataRecord']>()
    expect(result.requestExamples.example2!.parameters.headers.length).toBe(2)
    expect(result.requestExamples.example2!.parameters.headers[0]!.key).toBe('Accept')
    expect(result.requestExamples.example2!.parameters.headers[0]!.value).toBe('application/json')
  })

  it('should add default selectedHttpClient to workspaces', () => {
    const mockData: v_2_4_0.DataRecord = {
      requestExamples: {},
      collections: {},
      cookies: {},
      environments: {},
      requests: {},
      securitySchemes: {},
      servers: {},
      tags: {},
      workspaces: {
        default: {
          uid: 'default',
          name: 'Default Workspace',
          description: 'Default Workspace',
          collections: [],
          environments: {},
          hotKeyConfig: {
            modifiers: [],
            hotKeys: {},
          },
          activeEnvironmentId: 'default',
          cookies: [],
          proxyUrl: '',
          themeId: 'default',
        },
      },
    }

    // Perform migration
    const result = migrate_v_2_5_0(mockData)

    // Assertions
    expectTypeOf(result).toMatchTypeOf<v_2_5_0['DataRecord']>()
    expect(result.workspaces.default!.selectedHttpClient).toEqual({
      targetKey: 'shell',
      clientKey: 'curl',
    })
  })
})
