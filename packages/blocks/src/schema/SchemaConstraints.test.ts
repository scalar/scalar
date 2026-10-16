import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { type ConstraintSchema, schemaDialect } from './constraint-metadata'
import Schema from './Schema.vue'
import SchemaConstraint from './SchemaConstraint.vue'

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
    expect(wrapper.text()).toContain('Required properties: company')
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
    expect(wrapper.text()).toContain('Required properties: id')
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
})
