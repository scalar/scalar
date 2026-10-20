import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { type ConstraintSchema, schemaDialect } from './constraint-metadata'
import Schema from './Schema.vue'
import SchemaConstraint from './SchemaConstraint.vue'
import SchemaProperty from './SchemaProperty.vue'

const draft = (value: Record<string, unknown>): ConstraintSchema =>
  ({
    ...value,
    [schemaDialect]: 'draft-07',
  }) as ConstraintSchema
const render = (schema: ConstraintSchema, expandAllSchemaProperties = true) =>
  mount(Schema, {
    props: { schema, eventBus: null, options: { expandAllSchemaProperties } },
  })

describe('SchemaConstraints', () => {
  it('expands a conditional group without making branch properties unconditional', async () => {
    const schema = draft({
      type: 'object',
      properties: { kind: { type: 'string' } },
      if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
      then: { type: 'object', properties: { company: { type: 'string' } }, required: ['company'] },
      else: { required: ['person'] },
    })
    const wrapper = render(schema, false)
    expect(wrapper.text()).toContain('Conditional constraints')
    expect(wrapper.text()).not.toContain('company')
    const constraint = wrapper.getComponent(SchemaConstraint)
    expect(constraint.findAll('button')).toHaveLength(1)
    const toggle = constraint.get('button')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('If this schema matches')
    expect(wrapper.text()).toContain('business')
    expect(wrapper.text()).not.toContain('Required properties: company')
    expect(wrapper.text()).toContain('company')
    expect(wrapper.text()).not.toContain('Required properties: kind')
    expect(wrapper.text()).toContain('Required properties: person')
    await toggle.trigger('click')
    expect(wrapper.text()).not.toContain('company')
  })

  it('renders contains separately from items and preserves false schemas', () => {
    const wrapper = render(draft({ type: 'array', items: { type: 'string' }, contains: false }))
    expect(wrapper.text()).toContain('Contains at least one matching item')
    expect(wrapper.text()).toContain('Accepts no value.')
    expect(wrapper.text()).toContain('string')
  })

  it('renders property-list and referenced schema dependencies, including undeclared names', () => {
    const wrapper = render(
      draft({
        type: 'object',
        dependencies: {
          card: ['billingAddress'],
          account: {
            $ref: '#/components/schemas/Account',
            '$ref-value': { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
          },
        },
      }),
    )
    expect(wrapper.text()).toContain('When card is present')
    expect(wrapper.text()).toContain('Required properties: billingAddress')
    expect(wrapper.text()).toContain('When account is present')
    expect(wrapper.text()).not.toContain('Required properties: id')
    expect(wrapper.text()).toContain('id')
  })

  it('retains only required names without property rows in a mixed branch', () => {
    const wrapper = render(
      draft({
        if: true,
        then: { type: 'object', properties: { company: { type: 'string' } }, required: ['company', 'billingAddress'] },
      }),
    )
    expect(wrapper.text()).toContain('Required properties: billingAddress')
    expect(wrapper.text()).not.toContain('Required properties: company')
    expect(wrapper.text()).toContain('company')
  })

  it('keeps independent allOf conditions separate and ignores orphan branches', () => {
    const wrapper = render(
      draft({
        allOf: [
          draft({ if: true, then: { required: ['first'] } }),
          draft({ if: false, else: { required: ['second'] } }),
          draft({ then: { required: ['orphan'] } }),
        ],
      }),
    )
    expect(wrapper.findAllComponents(SchemaConstraint).length).toBe(2)
    expect(wrapper.text()).toContain('Required properties: first')
    expect(wrapper.text()).toContain('Required properties: second')
    expect(wrapper.text()).not.toContain('orphan')
  })

  it('does not connect an if outside allOf with a then inside it', () => {
    const wrapper = render(draft({ if: true, allOf: [draft({ then: { required: ['orphan'] } })] }))
    expect(wrapper.text()).toContain('Conditional constraints')
    expect(wrapper.text()).not.toContain('orphan')
  })

  it('retains constraints on nested object properties', () => {
    const wrapper = render(
      draft({
        type: 'object',
        properties: {
          nested: draft({ type: 'object', properties: { id: { type: 'string' } }, dependencies: { id: ['name'] } }),
        },
      }),
    )
    expect(wrapper.findAllComponents(SchemaConstraint).length).toBe(1)
    expect(wrapper.text()).toContain('Required properties: name')
  })

  it('stops recursive constraint references when expanding all', () => {
    const schema = draft({ type: 'object' })
    schema.dependencies = { next: { $ref: '#/components/schemas/Node', '$ref-value': schema } }
    const wrapper = render(schema)
    expect(wrapper.text()).toContain('recursive')
    expect(wrapper.findAllComponents(SchemaConstraint).length).toBe(2)
  })

  it('leaves OpenAPI constraint display unchanged', () => {
    const wrapper = render(
      coerceValue(SchemaObjectSchema, {
        type: 'object',
        if: true,
        then: false,
        contains: true,
        dependencies: { id: ['name'] },
      }),
    )
    expect(wrapper.findAllComponents(SchemaConstraint).length).toBe(0)
  })

  const document = { openapi: '3.1.0', info: { title: 'Accounts', version: '1' }, paths: {} } as OpenApiDocument
  const schema = {
    type: 'object',
    properties: { kind: { type: 'string' } },
    if: { type: 'object', properties: { kind: { type: 'string', const: 'business' } }, required: ['kind'] },
    then: { type: 'object', required: ['company'] },
    dependentRequired: { card: ['billingAddress'] },
    dependentSchemas: { card: { type: 'object', required: ['securityCode'] } },
    dependencies: { ignored: ['legacy'] },
  } as ConstraintSchema

  it.each([Schema, SchemaProperty])('renders modern constraints from shared entry points', (component) => {
    const wrapper = mount(component, {
      props: { schema, eventBus: null, options: { document, expandAllSchemaProperties: true } },
    })
    expect(wrapper.text()).toContain('Conditional constraints')
    expect(wrapper.text()).toContain('Required properties: company')
    expect(wrapper.text()).toContain('Required properties: billingAddress')
    expect(wrapper.text()).toContain('Required properties: securityCode')
    expect(wrapper.text()).not.toContain('legacy')
    expect(
      wrapper
        .findAllComponents(SchemaConstraint)
        .filter((part) => part.props('label') === 'When card is present')
        .map((part) => part.findAll('p').map((paragraph) => paragraph.text())),
    ).toEqual([['Required properties: billingAddress'], ['Required properties: securityCode']])
  })

  it.each([
    [0, 2, 'Matching items: 0–2'],
    [2, undefined, 'Matching items: 2–∞'],
    [undefined, 3, 'Matching items: 1–3'],
    [undefined, undefined, 'Contains at least one matching item'],
  ])('renders contains bounds %s and %s', (minContains, maxContains, label) => {
    const wrapper = mount(Schema, {
      props: {
        schema: {
          type: 'array',
          items: { type: 'string' },
          contains: { const: 'priority' },
          minContains,
          maxContains,
        } as ConstraintSchema,
        eventBus: null,
        options: { document, expandAllSchemaProperties: true },
      },
    })
    expect(wrapper.text()).toContain(label)
    expect(wrapper.text()).toContain('priority')
  })

  it('ignores modern keywords under Draft-07 and bounds without contains', () => {
    const wrapper = mount(Schema, {
      props: {
        schema: { ...schema, $schema: 'http://json-schema.org/draft-07/schema#', minContains: 0, maxContains: 2 },
        eventBus: null,
        options: { document, expandAllSchemaProperties: true },
      },
    })
    expect(wrapper.text()).toContain('Required properties: legacy')
    expect(wrapper.text()).not.toContain('billingAddress')
    expect(wrapper.text()).not.toContain('securityCode')
    expect(wrapper.text()).not.toContain('Matching items')
  })

  it('does not render constraints in unknown dialects or upgraded OpenAPI 3.0 documents', () => {
    for (const overrides of [
      { jsonSchemaDialect: 'https://example.com/custom' },
      { 'x-original-oas-version': '3.0.4' },
    ]) {
      const wrapper = mount(Schema, {
        props: {
          schema,
          eventBus: null,
          options: { document: { ...document, ...overrides }, expandAllSchemaProperties: true },
        },
      })
      expect(wrapper.findComponent(SchemaConstraint).exists()).toBe(false)
    }
  })
  it('renders a referenced constraint through the property entry point', () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        schema: { $ref: '#/components/schemas/Account', '$ref-value': schema } as unknown as ConstraintSchema,
        eventBus: null,
        options: { document, expandAllSchemaProperties: true },
      },
    })
    expect(wrapper.text()).toContain('Conditional constraints')
    expect(wrapper.text()).toContain('Required properties: billingAddress')
  })
})
