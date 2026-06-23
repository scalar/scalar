import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { findClient } from './helpers/find-client'
import { generateClientOptions } from './helpers/generate-client-options'
import { createCodeExample } from './mount'

/** Spins up a store with a single POST /hello operation. */
const createStore = async () => {
  const store = createWorkspaceStore()

  await store.addDocument({
    name: 'default',
    document: {
      openapi: '3.1.0',
      info: { title: 'Petstore', version: '1.0.0' },
      paths: {
        '/hello': {
          post: {
            summary: 'Hello World',
            requestBody: {
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { name: { type: 'string' } } },
                },
              },
            },
          },
        },
      },
    },
  })

  return store
}

describe('mount', () => {
  const mounted: Array<{ destroy: () => void }> = []

  afterEach(() => {
    mounted.forEach((instance) => instance.destroy())
    mounted.length = 0
    document.body.innerHTML = ''
  })

  it('renders the resolved operation into the target element', async () => {
    const store = await createStore()
    const element = document.createElement('div')

    const instance = createCodeExample(element, { store, path: '/hello', method: 'post' })
    mounted.push(instance)

    // The wrapper scopes the styles and the operation resolved enough to render the method badge.
    expect(element.querySelector('.scalar-app')).not.toBeNull()
    expect(element.textContent).toMatch(/post/i)
  })

  it('accepts a CSS selector for the target element', async () => {
    const store = await createStore()
    const element = document.createElement('div')
    element.id = 'block'
    document.body.appendChild(element)

    const instance = createCodeExample('#block', { store, path: '/hello', method: 'post' })
    mounted.push(instance)

    expect(element.querySelector('.scalar-app')).not.toBeNull()
  })

  it('throws when the selector matches no element', async () => {
    const store = await createStore()

    expect(() => createCodeExample('#missing', { store, path: '/hello', method: 'post' })).toThrow(
      'Element not found: #missing',
    )
  })

  it('throws when the operation cannot be resolved', async () => {
    const store = await createStore()
    const element = document.createElement('div')

    expect(() => createCodeExample(element, { store, path: '/missing', method: 'get' })).toThrow(
      'Operation not found: GET /missing',
    )
  })

  it('forces a color mode on the wrapper only when darkMode is provided', async () => {
    const store = await createStore()

    // The block renders into a single wrapper element that carries the color-mode class.
    const wrapperOf = (el: HTMLElement) => el.firstElementChild as HTMLElement

    const dark = document.createElement('div')
    mounted.push(createCodeExample(dark, { store, path: '/hello', method: 'post', darkMode: true }))
    expect(wrapperOf(dark).classList.contains('dark-mode')).toBe(true)

    const light = document.createElement('div')
    mounted.push(createCodeExample(light, { store, path: '/hello', method: 'post', darkMode: false }))
    expect(wrapperOf(light).classList.contains('light-mode')).toBe(true)

    const inherit = document.createElement('div')
    mounted.push(createCodeExample(inherit, { store, path: '/hello', method: 'post' }))
    expect(wrapperOf(inherit).classList.contains('dark-mode')).toBe(false)
    expect(wrapperOf(inherit).classList.contains('light-mode')).toBe(false)
    expect(wrapperOf(inherit).classList.contains('scalar-app')).toBe(true)
  })

  it('reads the selected client from the store, not just the initial option', async () => {
    const store = await createStore()

    // A previous selection (or another block) set the workspace default client.
    // The block must honor the store over its own `selectedClient` seed so the
    // choice persists across re-renders and is shared through the store.
    store.workspace['x-scalar-default-client'] = 'js/fetch'

    const expectedTitle = findClient(generateClientOptions(), 'js/fetch')?.title
    expect(expectedTitle).toBeTruthy()

    const element = document.createElement('div')
    const instance = createCodeExample(element, { store, path: '/hello', method: 'post' })
    mounted.push(instance)

    const picker = element.querySelector('[data-testid="client-picker"]')
    expect(picker?.textContent).toContain(expectedTitle)
  })

  it('keeps rendering the last resolved operation when it disappears from the active document', async () => {
    const store = await createStore()
    const element = document.createElement('div')

    const instance = createCodeExample(element, { store, path: '/hello', method: 'post' })
    mounted.push(instance)

    expect(element.textContent).toMatch(/post/i)

    // Switch to a document that does not define the operation. The block must not
    // feed `undefined` to CodeExample (which would crash reading `operation.requestBody`);
    // it keeps the last resolved operation instead.
    await store.addDocument({
      name: 'empty',
      document: { openapi: '3.1.0', info: { title: 'Empty', version: '1.0.0' }, paths: {} },
    })
    store.workspace['x-scalar-active-document'] = 'empty'
    await nextTick()

    expect(store.workspace.activeDocument?.info.title).toBe('Empty')
    expect(element.textContent).toMatch(/post/i)
  })

  it('reads the selected example from the store, not just the initial option', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.0',
        info: { title: 'Petstore', version: '1.0.0' },
        paths: {
          '/hello': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    examples: {
                      first: { value: { name: 'first-example' } },
                      second: { value: { name: 'second-example' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Another block (or a previous pick) set the document-wide example. The block
    // must honor the store over its own `selectedExample` seed.
    store.workspace['x-scalar-default-example'] = 'second'

    const element = document.createElement('div')
    document.body.appendChild(element)
    mounted.push(createCodeExample(element, { store, path: '/hello', method: 'post', selectedExample: 'first' }))

    expect(element.textContent).toContain('second-example')
    expect(element.textContent).not.toContain('first-example')
  })

  it('derives the server from the active document when no server is passed', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.0',
        info: { title: 'Petstore', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        paths: {
          '/hello': {
            post: {
              requestBody: {
                content: { 'application/json': { schema: { type: 'object' } } },
              },
            },
          },
        },
      },
    })

    const element = document.createElement('div')
    document.body.appendChild(element)
    mounted.push(createCodeExample(element, { store, path: '/hello', method: 'post' }))

    expect(element.textContent).toContain('api.example.com')
  })

  it('keeps the operation and its server from the same document when the operation disappears', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.0',
        info: { title: 'Petstore', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        paths: { '/hello': { post: { requestBody: { content: { 'application/json': { schema: {} } } } } } },
      },
    })

    const element = document.createElement('div')
    document.body.appendChild(element)
    mounted.push(createCodeExample(element, { store, path: '/hello', method: 'post' }))
    expect(element.textContent).toContain('api.example.com')

    // Swap to a document that lacks the operation but defines a different server.
    // The block must keep the last operation paired with the server it came from,
    // never the new document's server, so a snippet never mixes two specs.
    await store.addDocument({
      name: 'other',
      document: {
        openapi: '3.1.0',
        info: { title: 'Other', version: '1.0.0' },
        servers: [{ url: 'https://other.example.com' }],
        paths: {},
      },
    })
    store.workspace['x-scalar-active-document'] = 'other'
    await nextTick()

    expect(element.textContent).toContain('api.example.com')
    expect(element.textContent).not.toContain('other.example.com')
  })

  it('clears the rendered content when destroyed', async () => {
    const store = await createStore()
    const element = document.createElement('div')

    const instance = createCodeExample(element, { store, path: '/hello', method: 'post' })
    expect(element.innerHTML).not.toBe('')

    instance.destroy()
    expect(element.innerHTML).toBe('')
  })
})
