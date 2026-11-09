import { ScalarCopy } from '@scalar/components/copy'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaLanguage from './SchemaLanguage.vue'
import SchemaSource from './SchemaSource.vue'

describe('SchemaLanguage', () => {
  it('renders angle brackets literally inside authored Markdown code', () => {
    const wrapper = mount(SchemaLanguage, {
      props: {
        format: 'application/raml+yaml;version=1.0',
        value: { properties: { values: { type: 'string', description: '`map<string, Foo>`' } } },
      },
    })
    expect(wrapper.get('code').text()).toBe('map<string, Foo>')
    wrapper.unmount()
  })

  it('renders native fields without a duplicate source block', () => {
    const value = 'syntax = "proto3";\nmessage User { string user_id = 1; }\n'
    const wrapper = mount(SchemaLanguage, { props: { format: 'application/vnd.google.protobuf;version=3', value } })
    expect(wrapper.text()).toContain('user_id')
    expect(wrapper.findComponent(SchemaSource).exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/(?:Show|Hide) schema source/)
    expect(wrapper.text()).toContain('#1')
    wrapper.unmount()
  })

  it('selects oneof members with the shared schema selector', async () => {
    const wrapper = mount(SchemaLanguage, {
      props: {
        format: 'application/vnd.google.protobuf;version=3',
        value:
          'syntax = "proto3"; message User { string id = 1; oneof contact { string email = 2; string phone = 3; } }',
      },
    })
    const selector = wrapper.getComponent({ name: 'ScalarListbox' })
    expect(wrapper.text()).toContain('#2')
    expect(wrapper.text()).not.toContain('#3')
    await selector.vm.$emit('update:modelValue', { id: '1', label: 'contact: phone' })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('#3')
    expect(wrapper.text()).not.toContain('#2')
    await selector.vm.$emit('update:modelValue', { id: '2', label: 'contact: Not set' })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('contact: Not set')
    expect(wrapper.text()).not.toContain('#3')
    expect(wrapper.text()).toContain('#1')
    expect(wrapper.findComponent(SchemaSource).exists()).toBe(false)
    wrapper.unmount()
  })

  it('uses the shared default-value control for Avro reader defaults', () => {
    const wrapper = mount(SchemaLanguage, {
      props: {
        format: 'application/vnd.apache.avro+json;version=1.9.0',
        value: {
          type: 'record',
          name: 'R',
          fields: [
            { name: 'enabled', type: 'boolean', default: false },
            { name: 'parent', type: ['null', 'string'], default: null },
          ],
        },
      },
    })
    const defaults = wrapper.findAllComponents({ name: 'SchemaPropertyDefault' })
    expect(defaults.map((control) => control.props('value')).filter((value) => value !== undefined)).toEqual([
      false,
      null,
    ])
    expect(wrapper.text()).not.toContain('Reader default:')
    expect(wrapper.text()).not.toContain('required')
    wrapper.unmount()
  })

  it('renders native recursive fields with the shared inline indicator', () => {
    const wrapper = mount(SchemaLanguage, {
      props: {
        format: 'application/vnd.google.protobuf;version=3',
        value: 'syntax = "proto3"; message User { User parent = 1; repeated User children = 2; }',
      },
    })
    expect(wrapper.text()).toContain('recursive')
    expect(wrapper.text()).not.toContain('Recursive reference')
    expect(wrapper.findAll('[title="Recursive reference to User"]').length).toBe(2)
    wrapper.unmount()
  })

  it('preserves the recursion indicator when flattening a nullable Avro union', () => {
    const wrapper = mount(SchemaLanguage, {
      props: {
        format: 'application/vnd.apache.avro+json;version=1.9.0',
        value: { type: 'record', name: 'User', fields: [{ name: 'parent', type: ['null', 'User'] }] },
      },
    })
    expect(wrapper.get('[title="Recursive reference to User"]').text()).toBe('recursive')
    expect(wrapper.text()).not.toContain('Recursive reference')
    wrapper.unmount()
  })

  it('renders presence labels without turning their explanations into descriptions', () => {
    const wrapper = mount(SchemaLanguage, {
      props: {
        format: 'application/vnd.google.protobuf;version=3',
        value: 'syntax = "proto3"; message User { optional string nickname = 1; string name = 2; }',
      },
    })
    expect(wrapper.text()).toContain('Optional (explicit presence)')
    expect(wrapper.text()).toContain('Optional (implicit presence)')
    expect(wrapper.find('[tabindex="0"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('preserves declarations and keeps oneof choices between surrounding fields', async () => {
    const wrapper = mount(SchemaLanguage, {
      props: {
        format: 'application/vnd.google.protobuf;version=2',
        value: `syntax = "proto2";
          message M {
            optional string zebra = 9;
            required string alpha = 1;
            oneof contact { string phone = 8; string email = 2; }
            optional string middle = 7;
            oneof location { string zip = 6; string city = 3; }
            optional string last = 4;
          }`,
        options: { orderSchemaPropertiesBy: 'alpha', orderRequiredPropertiesFirst: true },
      },
    })
    const names = (): string[] => wrapper.findAll('.property-name').map((name) => name.text())
    expect(names()).toEqual(['zebra', 'alpha', 'phone', 'middle', 'zip', 'last'])
    const selectors = wrapper.findAllComponents({ name: 'ScalarListbox' })
    await selectors[0]!.vm.$emit('update:modelValue', { id: '1', label: 'contact: email' })
    await wrapper.vm.$nextTick()
    expect(names()).toEqual(['zebra', 'alpha', 'email', 'middle', 'zip', 'last'])
    wrapper.unmount()
  })

  it('switches between structured documentation and source as input changes', async () => {
    const wrapper = mount(SchemaLanguage, {
      props: { format: 'application/raml+yaml;version=1.0', value: 'type: object\nproperties:\n  id: string' },
    })
    expect(wrapper.text()).toMatch(/required/i)
    expect(wrapper.findComponent(SchemaSource).exists()).toBe(false)
    await wrapper.setProps({ value: 'type: !include external.raml' })
    expect(wrapper.find('details, summary').exists()).toBe(false)
    expect(wrapper.getComponent(SchemaSource).isVisible()).toBe(true)
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe('type: !include external.raml')
    await wrapper.setProps({ value: 'type: integer' })
    expect(wrapper.findComponent(SchemaSource).exists()).toBe(false)
    expect(wrapper.text()).toContain('integer')
    wrapper.unmount()
  })

  it('keeps non-map header schemas on the source path', () => {
    const wrapper = mount(SchemaLanguage, {
      props: { format: 'application/raml+yaml;version=1.0', value: 'type: string[]', headers: true },
    })
    expect(wrapper.find('details, summary').exists()).toBe(false)
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe('type: string[]')
    wrapper.unmount()
  })

  it('escapes authored descriptions and field names', () => {
    const wrapper = mount(SchemaLanguage, {
      props: {
        format: 'application/raml+yaml;version=1.0',
        value: { properties: { '<script>': { type: 'string', description: '<img src=x onerror=alert(1)>' } } },
      },
    })
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('[onerror]').exists()).toBe(false)
    expect(wrapper.text()).toContain('<script>')
    wrapper.unmount()
  })
})
