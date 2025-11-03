import { describe, expect, it } from 'vitest'

import type { Workspace, WorkspaceDocument } from '@/schemas/workspace'

import { upsertEnvironment, upsertEnvironmentVariable } from './environment'

describe('environment', () => {
  it('creates a new environment in workspace and sets it as active', () => {
    const workspace: Workspace = {
      documents: {},
      activeDocument: undefined,
    }

    const result = upsertEnvironment(null, workspace, {
      environmentName: 'production',
      payload: {
        color: '#ff0000',
        variables: [],
      },
      collectionType: 'workspace',
    })

    expect(result).toEqual({
      color: '#ff0000',
      variables: [],
    })
    expect(workspace['x-scalar-environments']).toEqual({
      production: {
        color: '#ff0000',
        variables: [],
      },
    })
    expect(workspace['x-scalar-active-environment']).toBe('production')
  })

  it('updates an existing environment without changing active environment', () => {
    const workspace: Workspace = {
      documents: {},
      activeDocument: undefined,
      'x-scalar-environments': {
        production: {
          color: '#ff0000',
          variables: [
            {
              name: 'API_KEY',
              value: 'old-key',
            },
          ],
        },
        staging: {
          color: '#00ff00',
          variables: [],
        },
      },
      'x-scalar-active-environment': 'staging',
    }

    const result = upsertEnvironment(null, workspace, {
      environmentName: 'production',
      payload: {
        description: 'Updated production environment',
        color: '#0000ff',
      },
      collectionType: 'workspace',
    })

    expect(result).toEqual({
      description: 'Updated production environment',
      color: '#0000ff',
      variables: [
        {
          name: 'API_KEY',
          value: 'old-key',
        },
      ],
    })
    // Active environment should remain unchanged when updating existing environment
    expect(workspace['x-scalar-active-environment']).toBe('staging')
    // Variables should be preserved when updating
    if (workspace['x-scalar-environments']) {
      expect(workspace['x-scalar-environments'].production?.variables).toHaveLength(1)
    }
  })

  it('renames an environment and removes the old one', () => {
    const workspace: Workspace = {
      documents: {},
      activeDocument: undefined,
      'x-scalar-environments': {
        dev: {
          color: '#ff0000',
          variables: [
            {
              name: 'BASE_URL',
              value: 'http://localhost:3000',
            },
          ],
        },
      },
      'x-scalar-active-environment': 'dev',
    }

    const result = upsertEnvironment(null, workspace, {
      environmentName: 'development',
      payload: {
        description: 'Development environment',
      },
      collectionType: 'workspace',
      oldEnvironmentName: 'dev',
    })

    expect(result).toEqual({
      description: 'Development environment',
      color: '#ff0000',
      variables: [
        {
          name: 'BASE_URL',
          value: 'http://localhost:3000',
        },
      ],
    })
    // Old environment should be deleted
    if (workspace['x-scalar-environments']) {
      expect(workspace['x-scalar-environments'].dev).toBeUndefined()
      // New environment should exist with all original data
      expect(workspace['x-scalar-environments'].development).toBeDefined()
      expect(workspace['x-scalar-environments'].development?.variables).toHaveLength(1)
    }
    // Active environment should be updated to the new name when renaming an active environment
    expect(workspace['x-scalar-active-environment']).toBe('development')
  })

  it('adds a new variable to an environment', () => {
    const document: WorkspaceDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      'x-scalar-original-document-hash': 'test-hash',
      'x-scalar-environments': {
        production: {
          color: '#ff0000',
          variables: [
            {
              name: 'API_KEY',
              value: 'existing-key',
            },
          ],
        },
      },
    }

    const result = upsertEnvironmentVariable(document, {
      environmentName: 'production',
      variable: {
        name: 'BASE_URL',
        value: {
          description: 'Production API URL',
          default: 'https://api.example.com',
        },
      },
      collectionType: 'document',
    })

    expect(result).toEqual({
      name: 'BASE_URL',
      value: {
        description: 'Production API URL',
        default: 'https://api.example.com',
      },
    })
    if (document['x-scalar-environments']) {
      expect(document['x-scalar-environments'].production?.variables).toHaveLength(2)
      expect(document['x-scalar-environments'].production?.variables[1]).toEqual({
        name: 'BASE_URL',
        value: {
          description: 'Production API URL',
          default: 'https://api.example.com',
        },
      })
    }
  })

  it('updates an existing variable by index and deletes if name is empty', () => {
    const workspace: Workspace = {
      documents: {},
      activeDocument: undefined,
      'x-scalar-environments': {
        staging: {
          color: '#00ff00',
          variables: [
            {
              name: 'TOKEN',
              value: 'abc123',
            },
            {
              name: 'DEBUG',
              value: 'true',
            },
            {
              name: 'PORT',
              value: '8080',
            },
          ],
        },
      },
    }

    // Update the second variable
    const updateResult = upsertEnvironmentVariable(workspace, {
      environmentName: 'staging',
      variable: {
        name: 'DEBUG',
        value: 'false',
      },
      index: 1,
      collectionType: 'workspace',
    })

    expect(updateResult).toEqual({
      name: 'DEBUG',
      value: 'false',
    })
    const environments = workspace['x-scalar-environments']
    if (environments) {
      expect(environments.staging?.variables).toHaveLength(3)
      expect(environments.staging?.variables?.[1]?.value).toBe('false')
    }

    // Delete a variable by setting name to empty string
    const deleteResult = upsertEnvironmentVariable(workspace, {
      environmentName: 'staging',
      variable: {
        name: '',
        value: '',
      },
      index: 0,
      collectionType: 'workspace',
    })

    expect(deleteResult).toBeUndefined()
    if (environments) {
      expect(environments.staging?.variables).toHaveLength(2)
      // First variable should be removed, so DEBUG should now be at index 0
      expect(environments.staging?.variables?.[0]?.name).toBe('DEBUG')
    }
  })
})
