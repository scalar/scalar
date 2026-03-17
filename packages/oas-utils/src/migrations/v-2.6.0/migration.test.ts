import { describe, expect, expectTypeOf, it } from 'vitest'

import { migrate_v_2_6_0 } from './migration'
import type { v_2_6_0 } from './types.generated'

describe('migrate_v_2_6_0', () => {
  it('migrates fastify theme to default', () => {
    const mockData = {
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
          themeId: 'fastify',
          selectedHttpClient: {
            targetKey: 'shell',
            clientKey: 'curl',
          },
        },
      },
    }

    const result = migrate_v_2_6_0(mockData as any)

    expectTypeOf(result).toMatchTypeOf<v_2_6_0['DataRecord']>()
    expect(result.workspaces.default!.themeId).toBe('default')
  })

  it('migrates elysiajs theme to default', () => {
    const mockData = {
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
          themeId: 'elysiajs',
          selectedHttpClient: {
            targetKey: 'shell',
            clientKey: 'curl',
          },
        },
      },
    }

    const result = migrate_v_2_6_0(mockData as any)

    expectTypeOf(result).toMatchTypeOf<v_2_6_0['DataRecord']>()
    expect(result.workspaces.default!.themeId).toBe('default')
  })

  it('preserves other theme values', () => {
    const mockData = {
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
          themeId: 'moon',
          selectedHttpClient: {
            targetKey: 'shell',
            clientKey: 'curl',
          },
        },
      },
    }

    const result = migrate_v_2_6_0(mockData as any)

    expectTypeOf(result).toMatchTypeOf<v_2_6_0['DataRecord']>()
    expect(result.workspaces.default!.themeId).toBe('moon')
  })

  it('handles empty workspaces', () => {
    const mockData = {
      requestExamples: {},
      collections: {},
      cookies: {},
      environments: {},
      requests: {},
      securitySchemes: {},
      servers: {},
      tags: {},
      workspaces: {},
    }

    const result = migrate_v_2_6_0(mockData as any)

    expectTypeOf(result).toMatchTypeOf<v_2_6_0['DataRecord']>()
    expect(Object.keys(result.workspaces)).toHaveLength(0)
  })
})
