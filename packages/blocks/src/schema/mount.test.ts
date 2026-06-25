import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { createSchema } from './mount'

/** Spins up a store with a single `User` schema. */
const createStore = async () => {
  const store = createWorkspaceStore()

  await store.addDocument({
    name: 'default',
    document: {
      openapi: '3.1.0',
      info: { title: 'Petstore', version: '1.0.0' },
      components: {
        schemas: {
          User: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
      paths: {},
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

  it('renders a schema passed directly into the target element', () => {
    const element = document.createElement('div')

    const instance = createSchema(element, {
      schema: { type: 'object', properties: { name: { type: 'string' } } },
    })
    mounted.push(instance)

    expect(element.querySelector('.scalar-app')).not.toBeNull()
    expect(element.textContent).toContain('name')
  })

  it('resolves a schema from the store by pointer', async () => {
    const store = await createStore()
    const element = document.createElement('div')

    const instance = createSchema(element, { store, pointer: '#/components/schemas/User' })
    mounted.push(instance)

    expect(element.textContent).toContain('name')
  })

  it('throws when the selector matches no element', () => {
    expect(() => createSchema('#missing', { schema: { type: 'object' } })).toThrow('Element not found: #missing')
  })

  it('throws when no schema can be resolved', async () => {
    const store = await createStore()
    const element = document.createElement('div')

    expect(() => createSchema(element, { store, pointer: '#/components/schemas/Missing' })).toThrow(
      /No schema to render/,
    )
  })

  it('keeps the schema and its document together when the schema disappears from the active document', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.0',
        info: { title: 'Petstore', version: '1.0.0' },
        components: {
          schemas: {
            // The `pet` property only references `Cat` through a discriminator
            // mapping, so the mapping has to be resolved against the document
            // `Pet` came from.
            Pet: {
              type: 'object',
              properties: {
                pet: {
                  type: 'object',
                  discriminator: {
                    propertyName: 'petType',
                    mapping: { cat: '#/components/schemas/Cat' },
                  },
                  properties: { petType: { type: 'string' } },
                },
              },
            },
            Cat: { type: 'object', title: 'Cat', properties: { meows: { type: 'boolean' } } },
          },
        },
        paths: {},
      },
    })

    const element = document.createElement('div')
    document.body.appendChild(element)
    mounted.push(createSchema(element, { store, pointer: '#/components/schemas/Pet' }))

    // The discriminator mapping resolves `Cat` from the same document.
    expect(element.textContent).toContain('Cat')

    // Swap to a document that lacks `Pet` (and `Cat`). The block keeps rendering
    // the last `Pet` schema, and its discriminator mapping must still resolve
    // against the document `Pet` came from, so `Cat` does not disappear.
    await store.addDocument({
      name: 'other',
      document: { openapi: '3.1.0', info: { title: 'Other', version: '1.0.0' }, paths: {} },
    })
    store.workspace['x-scalar-active-document'] = 'other'
    await nextTick()

    expect(store.workspace.activeDocument?.info.title).toBe('Other')
    expect(element.textContent).toContain('Cat')
  })

  it('clears the rendered content when destroyed', () => {
    const element = document.createElement('div')

    const instance = createSchema(element, { schema: { type: 'object', properties: { name: { type: 'string' } } } })
    expect(element.innerHTML).not.toBe('')

    instance.destroy()
    expect(element.innerHTML).toBe('')
  })
})
