import { sleep } from '@test/utils/sleep.ts'
import { ref } from '@vue/reactivity'
/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { createWorkspace, localStoragePlugin } from './create-workspace.ts'

describe('create-workspace', () => {
  it('creates a workspace and exports the state as an OpenAPI document', () => {
    const workspace = createWorkspace()

    workspace.load('default', {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                description: 'Test response',
              },
            },
          },
        },
      },
    })

    const result = workspace.export('default')

    expect(result).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                description: 'Test response',
              },
            },
          },
        },
      },
    })
  })

  it('imports content asynchronously', async () => {
    const workspace = createWorkspace()

    // Simulate fetching content from a remote server
    workspace.load('default', async () => {
      await sleep(50)

      return {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      }
    })

    await sleep(100)

    expect(workspace.state.collections.default?.document).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('creates a workspace from a Ref<Record<string, unknown>>', () => {
    const workspace = createWorkspace()
    const definition = ref({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })

    workspace.load('default', definition)

    expect(workspace.state.collections.default?.document).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })

    // Update the ref value
    definition.value = {
      openapi: '3.1.1',
      info: {
        title: 'Updated API',
        version: '1.0.0',
      },
      paths: {},
    }

    // Verify the workspace updates
    // @ts-expect-error TODO: fix this
    expect(workspace.state.collections.default?.document?.info?.title).toBe('Updated API')
  })

  it('creates a workspace from a Ref<string>', () => {
    const workspace = createWorkspace()
    const definition = ref(
      JSON.stringify({
        openapi: '3.1.1',
        info: { title: 'Example', version: '1.0.0' },
        paths: {},
      }),
    )

    workspace.load('default', definition)

    expect(workspace.state.collections.default?.document).toMatchObject({
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      paths: {},
    })

    // Update the ref value
    definition.value = JSON.stringify({
      openapi: '3.1.1',
      info: { title: 'Updated Example', version: '1.0.0' },
      paths: {},
    })

    // Verify the workspace updates
    // @ts-expect-error TODO: fix this
    expect(workspace.state.collections.default?.document?.info?.title).toBe('Updated Example')
  })

  it('persists the state to localStorage', async () => {
    const workspace = createWorkspace({
      plugins: [localStoragePlugin()],
    })

    workspace.load('default', {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })

    // Wait for the watcher to do its thing
    await sleep(100)

    // Parse the localStorage value before comparing
    const state = JSON.parse(localStorage.getItem('state') || '{}')

    expect(state.collections.default.document).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('restores the state from localStorage', async () => {
    localStorage.setItem(
      'state',
      JSON.stringify({
        collections: {
          default: {
            openapi: '3.1.1',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {},
          },
        },
      }),
    )

    const workspace = createWorkspace({
      plugins: [localStoragePlugin()],
    })

    expect(workspace.state.collections.default).toBeDefined()
    expect(workspace.state.collections.default).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })
  })
})
