import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { afterEach, describe, expect, it } from 'vitest'

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

  it('clears the rendered content when destroyed', async () => {
    const store = await createStore()
    const element = document.createElement('div')

    const instance = createCodeExample(element, { store, path: '/hello', method: 'post' })
    expect(element.innerHTML).not.toBe('')

    instance.destroy()
    expect(element.innerHTML).toBe('')
  })
})
