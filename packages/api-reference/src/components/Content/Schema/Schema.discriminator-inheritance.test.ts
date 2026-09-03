import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Schema from './Schema.vue'

// Regression coverage for https://github.com/scalar/scalar/issues/9674
const buildDocument = async () => {
  const store = createWorkspaceStore({ meta: { 'x-scalar-active-document': 'default' } })
  await store.addDocument({
    name: 'default',
    document: {
      openapi: '3.1.0',
      info: { title: 'Pets', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          PetType: { type: 'string', enum: ['DOG', 'CAT'] },
          Pet: {
            type: 'object',
            required: ['petType'],
            discriminator: {
              propertyName: 'petType',
              mapping: {
                DOG: '#/components/schemas/Dog',
                CAT: '#/components/schemas/Cat',
              },
            },
            properties: { petType: { $ref: '#/components/schemas/PetType' } },
          },
          Dog: {
            allOf: [
              { $ref: '#/components/schemas/Pet' },
              { type: 'object', required: ['breed'], properties: { breed: { type: 'string' } } },
            ],
          },
          Cat: {
            allOf: [
              { $ref: '#/components/schemas/Pet' },
              {
                type: 'object',
                required: ['livesLeft'],
                properties: { livesLeft: { type: 'integer', format: 'int32' } },
              },
            ],
          },
        },
      },
    } as never,
  })

  return store.workspace.documents['default'] as never
}

describe('Schema discriminator inheritance (issue 9674)', () => {
  it('renders the variant selector for a discriminator-only base used as an object property', async () => {
    const document = await buildDocument()

    const wrapper = mount(Schema, {
      props: {
        eventBus: null,
        schema: (document as any).components.schemas.Pet,
        options: { expandAllSchemaProperties: true, document },
      },
    })

    expect(wrapper.find('.composition-selector').exists()).toBe(true)
    expect(wrapper.text()).toContain('One of')
    expect(wrapper.text()).toContain('breed')
    expect(wrapper.text()).toContain('Discriminator')
  })

  it('renders the variant selector for a discriminator-only base used as array items', async () => {
    const document = await buildDocument()

    const wrapper = mount(Schema, {
      props: {
        eventBus: null,
        schema: { type: 'array', items: (document as any).components.schemas.Pet } as never,
        options: { expandAllSchemaProperties: true, document },
      },
    })

    expect(wrapper.find('.composition-selector').exists()).toBe(true)
    expect(wrapper.text()).toContain('One of')
    expect(wrapper.text()).toContain('breed')
  })

  it('keeps a discriminator the subtype declares itself (nested polymorphism)', async () => {
    const store = createWorkspaceStore({ meta: { 'x-scalar-active-document': 'default' } })
    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.0',
        info: { title: 'Nested', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            // WorkingDog extends Dog but declares its own discriminator.
            Dog: {
              type: 'object',
              required: ['petType'],
              properties: { petType: { type: 'string' } },
            },
            WorkingDog: {
              allOf: [{ $ref: '#/components/schemas/Dog' }],
              discriminator: {
                propertyName: 'job',
                mapping: {
                  GUIDE: '#/components/schemas/GuideDog',
                },
              },
              properties: { job: { type: 'string' } },
            },
            GuideDog: {
              allOf: [
                { $ref: '#/components/schemas/WorkingDog' },
                { type: 'object', properties: { handler: { type: 'string' } } },
              ],
            },
          },
        },
      } as never,
    })
    const document = store.workspace.documents['default'] as never

    const wrapper = mount(Schema, {
      props: {
        eventBus: null,
        schema: (document as any).components.schemas.WorkingDog,
        options: { expandAllSchemaProperties: true, document },
      },
    })

    expect(wrapper.find('.composition-selector').exists()).toBe(true)
  })
})
