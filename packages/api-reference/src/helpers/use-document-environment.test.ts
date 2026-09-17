import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getActiveEnvironment, getEnvironmentVariables } from '@scalar/workspace-store/request-example'
import { describe, expect, it } from 'vitest'
import { effectScope } from 'vue'

import { useDocumentEnvironment } from './use-document-environment'

const environments = {
  production: {
    color: '#00cc66',
    variables: [{ name: 'uuidv4', value: { description: 'UUID', default: '123e4567-e89b-12d3-a456-426614174000' } }],
  },
  staging: { color: '#ff0000', variables: [{ name: 'uuidv4', value: 'staging-id' }] },
}

describe('use-document-environment', () => {
  it.each(['3.0.0', '3.1.0'])('resolves document variables in both embedded stores for OpenAPI %s', async (openapi) => {
    const scope = effectScope()
    try {
      for (const store of [createWorkspaceStore(), createWorkspaceStore()]) {
        scope.run(() => useDocumentEnvironment(store))
        await store.addDocument({
          name: 'api',
          document: {
            openapi,
            info: { title: 'API', version: '1' },
            'x-scalar-environments': environments,
            'x-scalar-active-environment': 'production',
          },
        })
        store.update('x-scalar-active-document', 'api')
        const result = getActiveEnvironment(store, store.workspace.activeDocument ?? null)
        expect(result.name).toBe('production')
        expect(getEnvironmentVariables(result.environment)).toStrictEqual({
          uuidv4: '123e4567-e89b-12d3-a456-426614174000',
        })
      }
    } finally {
      scope.stop()
    }
  })

  it('uses the first environment when the document does not select one', async () => {
    const store = createWorkspaceStore()
    const scope = effectScope()
    try {
      scope.run(() => useDocumentEnvironment(store))
      await store.addDocument({
        name: 'api',
        document: { openapi: '3.1.0', info: { title: 'API', version: '1' }, 'x-scalar-environments': environments },
      })
      store.update('x-scalar-active-document', 'api')
      expect(store.workspace['x-scalar-active-environment']).toBe('production')
    } finally {
      scope.stop()
    }
  })

  it.each(['staging', undefined])(
    'preserves a user selection of %s when document defaults change',
    async (selection) => {
      const store = createWorkspaceStore()
      const scope = effectScope()
      try {
        scope.run(() => useDocumentEnvironment(store))
        await store.addDocument({
          name: 'api',
          document: { openapi: '3.1.0', info: { title: 'API', version: '1' }, 'x-scalar-environments': environments },
        })
        store.update('x-scalar-active-document', 'api')
        store.update('x-scalar-active-environment', selection)
        await store.addDocument({
          name: 'second',
          document: {
            openapi: '3.1.0',
            info: { title: 'Second', version: '1' },
            'x-scalar-environments': environments,
            'x-scalar-active-environment': 'staging',
          },
        })
        store.update('x-scalar-active-document', 'second')
        expect(store.workspace['x-scalar-active-environment']).toBe(selection)
      } finally {
        scope.stop()
      }
    },
  )

  it('follows document defaults when switching documents and clears them for documents without environments', async () => {
    const store = createWorkspaceStore()
    const scope = effectScope()
    try {
      scope.run(() => useDocumentEnvironment(store))
      for (const [name, environment] of [
        ['first', 'production'],
        ['second', 'staging'],
        ['empty', undefined],
      ] as const) {
        await store.addDocument({
          name,
          document: {
            openapi: '3.1.0',
            info: { title: name, version: '1' },
            ...(environment
              ? { 'x-scalar-environments': environments, 'x-scalar-active-environment': environment }
              : {}),
          },
        })
        store.update('x-scalar-active-document', name)
        expect(store.workspace['x-scalar-active-environment']).toBe(environment)
      }
    } finally {
      scope.stop()
    }
  })
})
