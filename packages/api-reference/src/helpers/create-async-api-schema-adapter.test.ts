import { type DiscriminatorSchema, Schema, schemaDiscriminator } from '@scalar/blocks/schema'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createAsyncApiSchemaAdapter } from './create-async-api-schema-adapter'

const createDocument = (): AsyncApiDocument => ({
  asyncapi: '3.1.0',
  info: { title: 'Pets', version: '1' },
  'x-scalar-original-document-hash': '',
  components: {
    schemas: {
      Pet: {
        type: 'object',
        discriminator: 'petType',
        required: ['petType'],
        properties: { petType: { type: 'string' }, name: { type: 'string' } },
      },
      Cat: {
        title: 'Friendly cat',
        allOf: [
          { $ref: '#/components/schemas/Pet' },
          { type: 'object', properties: { huntingSkill: { type: 'string' } } },
        ],
      },
      StickInsect: {
        allOf: [
          { $ref: '#/components/schemas/Pet' },
          { type: 'object', properties: { petType: { const: 'StickBug' }, color: { type: 'string' } } },
        ],
      },
      Kitten: { allOf: [{ $ref: '#/components/schemas/Cat' }] },
      Unrelated: { type: 'object', properties: { age: { type: 'integer' } } },
    },
  },
})

describe('create-async-api-schema-adapter', () => {
  it('preserves discriminator semantics through workspace ingestion and proxy resolution', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'pets', document: createDocument() })
    const document = store.workspace.documents.pets as AsyncApiDocument
    const result = createAsyncApiSchemaAdapter(document)({ $ref: '#/components/schemas/Pet' }) as DiscriminatorSchema
    expect(result[schemaDiscriminator]?.variantLabels).toStrictEqual(['Pet', 'Cat', 'StickBug · StickInsect', 'Kitten'])
    const wrapper = mount(Schema, {
      props: { schema: result, eventBus: null, noncollapsible: true, options: { expandAllSchemaProperties: true } },
    })
    expect(wrapper.text()).toContain('Variants')
    expect(wrapper.text()).toContain('Discriminator value:')
    wrapper.unmount()
  })

  it('keeps component alias values distinct in selectors and direct references', () => {
    const document = createDocument()
    document.components = {
      schemas: {
        ...getResolvedRef(document.components)?.schemas,
        Alias: { $ref: '#/components/schemas/Cat' },
      },
    }
    const adapt = createAsyncApiSchemaAdapter(document)
    const result = adapt({ $ref: '#/components/schemas/Pet' }) as DiscriminatorSchema
    const value = (schema: DiscriminatorSchema | undefined): string | undefined =>
      (schema?.discriminator as { [schemaDiscriminator]?: { value: string } })?.[schemaDiscriminator]?.value
    expect(result[schemaDiscriminator]?.variantLabels).toStrictEqual([
      'Pet',
      'Cat',
      'StickBug · StickInsect',
      'Kitten',
      'Alias',
    ])
    expect(result.oneOf?.map((variant) => value(variant as DiscriminatorSchema))).toStrictEqual([
      'Pet',
      'Cat',
      'StickBug',
      'Kitten',
      'Alias',
    ])
    expect(value(adapt({ $ref: '#/components/schemas/Alias' }))).toBe('Alias')
    expect(value(adapt({ $ref: '#/components/schemas/Cat' }))).toBe('Cat')
  })

  it('leaves foreign schema-format discriminators untouched', () => {
    const schema = { type: 'object', discriminator: 'kind', properties: { kind: { type: 'string' } } }
    const result = createAsyncApiSchemaAdapter(createDocument())({ schemaFormat: 'application/schema+json', schema })
    expect(result).toBe(schema)
  })

  it.each([false, true])(
    'prefers a local value override over a referenced parent regardless of allOf order: %j',
    (reverse) => {
      const document = createDocument()
      const members = [
        { $ref: '#/components/schemas/StickInsect' },
        { type: 'object' as const, properties: { petType: { enum: ['LeafBug'] } } },
      ]
      document.components = {
        schemas: {
          ...getResolvedRef(document.components)?.schemas,
          LeafInsect: { allOf: reverse ? [...members].reverse() : members },
        },
      }
      const result = createAsyncApiSchemaAdapter(document)({ $ref: '#/components/schemas/Pet' }) as DiscriminatorSchema
      expect(result[schemaDiscriminator]?.variantLabels).toStrictEqual([
        'Pet',
        'Cat',
        'StickBug · StickInsect',
        'Kitten',
        'LeafBug · LeafInsect',
      ])
    },
  )

  it('lists the base and transitive descendants with effective values, without changing the document', () => {
    const document = createDocument()
    const original = structuredClone(document)
    const adapt = createAsyncApiSchemaAdapter(document)
    const result = adapt({ $ref: '#/components/schemas/Pet' }) as DiscriminatorSchema
    expect(result[schemaDiscriminator]?.variantLabels).toStrictEqual(['Pet', 'Cat', 'StickBug · StickInsect', 'Kitten'])
    expect(
      result.oneOf?.map((variant) => (variant as DiscriminatorSchema)[schemaDiscriminator]?.variantLabels),
    ).toStrictEqual([undefined, undefined, undefined, undefined])
    expect(document).toStrictEqual(original)
  })

  it('annotates inherited properties without adding const or enum constraints', () => {
    const adapt = createAsyncApiSchemaAdapter(createDocument())
    const cat = adapt({ $ref: '#/components/schemas/Cat' })
    const field = cat && 'properties' in cat ? (cat.properties?.petType as DiscriminatorSchema) : undefined
    expect(cat?.discriminator?.propertyName).toBe('petType')
    expect((cat?.discriminator as { [schemaDiscriminator]?: { value: string } })?.[schemaDiscriminator]).toStrictEqual({
      value: 'Cat',
    })
    expect(field?.const).toBeUndefined()
    expect(field?.enum).toBeUndefined()
  })

  it('adapts nested payloads and multi-format schemas', () => {
    const adapt = createAsyncApiSchemaAdapter(createDocument())
    const result = adapt({
      schemaFormat: 'application/vnd.aai.asyncapi+json;version=3.1.0',
      schema: { type: 'object', properties: { pet: { $ref: '#/components/schemas/Pet' } } },
    })
    const pet =
      result && 'properties' in result ? (getResolvedRef(result.properties?.pet) as DiscriminatorSchema) : undefined
    expect(pet?.[schemaDiscriminator]?.variantLabels).toStrictEqual(['Pet', 'Cat', 'StickBug · StickInsect', 'Kitten'])
  })

  it('does not invent an implicit name for an anonymous schema', () => {
    const adapt = createAsyncApiSchemaAdapter(createDocument())
    const result = adapt({ type: 'object', discriminator: 'kind', properties: { kind: { type: 'string' } } })
    const field = result && 'properties' in result ? (result.properties?.kind as DiscriminatorSchema) : undefined
    expect(field?.[schemaDiscriminator]).toBeUndefined()
    expect(result?.oneOf).toBeUndefined()
  })

  it('terminates cyclic inheritance and unresolved references', () => {
    const document = createDocument()
    document.components = {
      schemas: {
        A: {
          discriminator: 'kind',
          allOf: [{ $ref: '#/components/schemas/B' }],
          type: 'object',
          properties: { kind: { type: 'string' } },
        },
        B: { allOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/Missing' }] },
      },
    }
    const result = createAsyncApiSchemaAdapter(document)({ $ref: '#/components/schemas/A' }) as DiscriminatorSchema
    expect(result[schemaDiscriminator]?.variantLabels).toStrictEqual(['A', 'B'])
  })

  it('renders a selector and discriminator value using the shared schema component', async () => {
    const result = createAsyncApiSchemaAdapter(createDocument())({ $ref: '#/components/schemas/Pet' })
    const wrapper = mount(Schema, {
      attachTo: document.body,
      props: { schema: result, eventBus: null, options: { expandAllSchemaProperties: true }, noncollapsible: true },
    })
    expect(wrapper.text()).toContain('Variants')
    expect(wrapper.text()).toContain('Discriminator value:')
    const button = wrapper.findAll('button').find((button) => button.text().includes('Variants'))!
    await button.trigger('click')
    await flushPromises()
    const options = Array.from(document.querySelectorAll('[role="option"]'))
    expect(options.map((option) => option.textContent?.trim())).toStrictEqual([
      'Pet',
      'Cat',
      'StickBug · StickInsect',
      'Kitten',
    ])
    ;(options[2] as HTMLElement).click()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('color')
    expect(wrapper.text()).toContain('StickBug')
    expect(wrapper.text()).not.toContain('Discriminator value: Pet')
    wrapper.unmount()
  })
})
