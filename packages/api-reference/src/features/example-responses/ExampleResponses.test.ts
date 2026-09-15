import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ExampleResponses from './ExampleResponses.vue'

const mockCopyToClipboard = vi.fn()

vi.mock('@scalar/use-hooks/useClipboard', () => ({
  useClipboard: vi.fn(() => ({
    copyToClipboard: mockCopyToClipboard,
  })),
}))

describe('ExampleResponses', () => {
  it('renders a response summary without a description or examples', () => {
    const wrapper = mount(ExampleResponses, { props: { responses: { '204': { summary: 'Deletion completed' } } } })
    expect(wrapper.text()).toContain('Deletion completed')
  })

  it('renders an empty response when its schema reference is unresolved', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: '',
            content: {
              // @ts-expect-error An unresolved reference can arrive before document resolution completes.
              'application/json': { schema: { $ref: '#/components/schemas/Missing' } },
            },
          },
        },
      },
    })
    expect(wrapper.findComponent({ name: 'ExamplePicker' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(false)
    expect(wrapper.text()).toContain('No Body')
  })

  it.each([
    {
      type: 'string',
      anyOf: [
        { title: 'Phone', const: 'phone' },
        { title: 'Email', const: 'email' },
      ],
      expected: 'email',
    },
    {
      type: 'array',
      oneOf: [
        { title: 'Phone', items: { type: 'string', const: 'phone' } },
        { title: 'Email', items: { type: 'string', const: 'email' } },
      ],
      expected: ['email'],
    },
  ])('selects variants with a shared root $type', async ({ expected, ...definition }) => {
    const schema = coerceValue(SchemaObjectSchema, definition)
    const wrapper = mount(ExampleResponses, {
      props: { responses: { '200': { description: '', content: { 'application/json': { schema } } } } },
    })
    await wrapper.findComponent({ name: 'ExamplePicker' }).vm.$emit('update:modelValue', '1')
    await wrapper.get('button[aria-label="Copy example value"]').trigger('click')
    expect(mockCopyToClipboard).toHaveBeenLastCalledWith(
      typeof expected === 'string' ? expected : JSON.stringify(expected, null, 2),
    )
  })

  it.each(['anyOf', 'oneOf'])('selects and copies a generated %s response variant', async (composition) => {
    const phone = 'Phone number is associated with another account'
    const email = 'Email address is associated with another account'
    const schema = coerceValue(SchemaObjectSchema, {
      [composition]: [phone, email].map((message) => ({
        type: 'object',
        properties: { message: { type: 'string', default: message } },
        required: ['message'],
        additionalProperties: false,
      })),
    })
    const wrapper = mount(ExampleResponses, {
      props: { responses: { '409': { description: 'Conflict', content: { 'application/json': { schema } } } } },
    })
    const picker = wrapper.findComponent({ name: 'ExamplePicker' })
    expect(picker.props('modelValue')).toBe('0')
    expect(wrapper.text()).toContain(phone)
    expect(wrapper.text()).not.toContain(email)
    await picker.vm.$emit('update:modelValue', '1')
    expect(wrapper.text()).toContain(email)
    expect(wrapper.text()).not.toContain(phone)
    await wrapper.get('button[aria-label="Copy example value"]').trigger('click')
    expect(mockCopyToClipboard).toHaveBeenLastCalledWith(JSON.stringify({ message: email }, null, 2))
    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(wrapper.findComponent({ name: 'ExamplePicker' }).exists()).toBe(false)
    expect(wrapper.text()).toContain(phone)
    expect(wrapper.text()).toContain(email)
    await wrapper.get('input[type="checkbox"]').setValue(false)
    expect(wrapper.text()).toContain(email)
    expect(wrapper.text()).not.toContain(phone)
  })

  it('resets the generated variant when the response or content type changes', async () => {
    const schema = coerceValue(SchemaObjectSchema, {
      anyOf: [
        { type: 'string', default: 'first' },
        { type: 'string', default: 'second' },
      ],
    })
    const response = {
      description: '',
      content: {
        'application/json': { schema },
        'application/problem+json': { schema },
      },
    }
    const wrapper = mount(ExampleResponses, {
      props: { responses: { '200': response, '409': { ...response } } },
    })
    await wrapper.findComponent({ name: 'ExamplePicker' }).vm.$emit('update:modelValue', '1')
    expect(wrapper.text()).toContain('second')
    await wrapper.setProps({ selectedContentTypes: { '200': 'application/problem+json' } })
    expect(wrapper.findComponent({ name: 'ExamplePicker' }).props('modelValue')).toBe('0')
    expect(wrapper.text()).toContain('first')
    await wrapper.findComponent({ name: 'ExamplePicker' }).vm.$emit('update:modelValue', '1')
    await wrapper.findComponent({ name: 'ExampleResponseTabList' }).vm.$emit('change', 1)
    expect(wrapper.findComponent({ name: 'ExamplePicker' }).props('modelValue')).toBe('0')
    expect(wrapper.text()).toContain('first')
  })

  it('keeps explicit media type examples ahead of schema variants', async () => {
    const schema = coerceValue(SchemaObjectSchema, {
      anyOf: [
        { type: 'string', default: 'generated first' },
        { type: 'string', default: 'generated second' },
      ],
    })
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: '',
            content: {
              'application/json': {
                schema,
                examples: { first: { value: 'explicit first' }, second: { value: 'explicit second' } },
              },
            },
          },
        },
      },
    })
    expect(wrapper.findAllComponents({ name: 'ExamplePicker' }).length).toBe(1)
    expect(wrapper.find('[data-testid="response-variant-picker"]').exists()).toBe(false)
    await wrapper.findComponent({ name: 'ExamplePicker' }).vm.$emit('update:modelValue', 'second')
    expect(wrapper.text()).toContain('explicit second')
    expect(wrapper.text()).not.toContain('generated')
  })

  it('selects referenced variants without dropping shared response properties', async () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: { shared: { type: 'boolean', default: true } },
      oneOf: [
        {
          $ref: '#/components/schemas/Phone',
          '$ref-value': {
            title: 'Phone',
            type: 'object',
            properties: { message: { type: 'string', default: 'phone' } },
          },
        },
        {
          $ref: '#/components/schemas/Email',
          '$ref-value': {
            title: 'Email',
            type: 'object',
            properties: { message: { type: 'string', default: 'email' } },
          },
        },
      ],
    })
    const wrapper = mount(ExampleResponses, {
      props: { responses: { '200': { description: '', content: { 'application/json': { schema } } } } },
    })
    const picker = wrapper.findComponent({ name: 'ExamplePicker' })
    expect(picker.text()).toContain('Phone')
    await picker.vm.$emit('update:modelValue', '1')
    expect(picker.text()).toContain('Email')
    await wrapper.get('button[aria-label="Copy example value"]').trigger('click')
    expect(JSON.parse(mockCopyToClipboard.mock.lastCall?.[0])).toStrictEqual({ shared: true, message: 'email' })
  })

  it('renders a single example correctly', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                examples: {
                  example1: {
                    summary: 'Single example',
                    description: 'Single example details',
                    value: { message: 'Success' },
                  },
                },
              },
            },
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })

    expect(tabs.length).toBe(1)
    expect(tabs[0]?.text()).toContain('200')
    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('Success')
    expect(wrapper.text()).not.toContain('value')
    expect(examplePicker.exists()).toBe(false)
    expect(wrapper.text()).toContain('Single example')
    expect(wrapper.text()).toContain('Single example details')
  })

  it('multiple examples for the same status code', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                examples: {
                  example1: { description: 'First **details**', value: { message: 'Example 1' } },
                  example2: { description: 'Second details', value: { message: 'Example 2' } },
                },
              },
            },
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })
    const textSelectLabel = wrapper.find('[data-testid="example-picker"]')

    expect(tabs.length).toBe(1)
    expect(tabs[0]?.text()).toContain('200')

    expect(codeBlock.length).toBe(1)
    expect(textSelectLabel.text()).toContain('example1')
    expect(codeBlock[0]?.text()).toContain('Example 1')
    expect(codeBlock[0]?.text()).not.toContain('Example 2')
    expect(wrapper.find('strong').text()).toBe('details')
    expect(wrapper.text()).toContain('First details')
    expect(wrapper.text()).not.toContain('Second details')

    await examplePicker.vm.$emit('update:modelValue', 'example2')
    expect(wrapper.text()).not.toContain('Example 1')
    expect(wrapper.text()).toContain('Example 2')
    expect(wrapper.text()).toContain('Second details')
    expect(wrapper.text()).not.toContain('First details')
    expect(wrapper.text()).toContain('Successful response')
  })

  it('handles xml example response', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'XML response',
            content: {
              'application/xml': {
                examples: {
                  example1: { value: '<user><name>John</name><age>30</age></user>' },
                },
              },
            },
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })

    expect(tabs.length).toBe(1)
    expect(tabs[0]?.text()).toContain('Status: 200')
    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('XML response')
    expect(wrapper.text()).toContain('<user><name>John</name><age>30</age></user>')
    expect(examplePicker.exists()).toBe(false)
  })

  it('handles plain text example response', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Plain text response',
            content: {
              'text/plain': {
                examples: {
                  example1: { value: 'Hello world' },
                },
              },
            },
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })

    expect(tabs.length).toBe(1)
    expect(tabs[0]?.text()).toContain('200')
    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('Plain text response')
    expect(wrapper.text()).toContain('Hello world')
    expect(examplePicker.exists()).toBe(false)
  })

  it('handles HTML example response', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'HTML response',
            content: {
              'text/html': {
                examples: {
                  example1: { value: '<div>Hello <strong>world</strong></div>' },
                },
              },
            },
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })

    expect(tabs.length).toBe(1)
    expect(tabs[0]?.text()).toContain('200')
    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('HTML response')
    expect(wrapper.text()).toContain('<div>Hello <strong>world</strong></div>')
    expect(examplePicker.exists()).toBe(false)
  })

  it('handles multiple status codes', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { status: 'success' } },
                },
              },
            },
          },
          '400': {
            description: 'Error response',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { error: 'Bad request' } },
                },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { error: 'Internal server error' } },
                },
              },
            },
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    expect(tabs.length).toBe(3)
    expect(tabs[0]?.text()).toContain('200')
    expect(tabs[1]?.text()).toContain('400')
    expect(tabs[2]?.text()).toContain('500')

    const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
    expect(codeBlock.exists()).toBe(true)

    // Verify initial content shows first status code
    expect(wrapper.text()).toContain('Success response')
    expect(wrapper.text()).toContain('status')
    expect(wrapper.text()).toContain('success')
  })

  it('handles default status code along with numbered codes', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { status: 'success' } },
                },
              },
            },
          },
          'default': {
            description: 'Default error response',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { error: 'Unexpected error' } },
                },
              },
            },
          },
          '404': {
            description: 'Not found error',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { error: 'Resource not found' } },
                },
              },
            },
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    expect(tabs.length).toBe(3)
    expect(tabs[0]?.text()).toContain('200')
    expect(tabs[1]?.text()).toContain('404')
    expect(tabs[2]?.text()).toContain('default')

    const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
    expect(codeBlock.exists()).toBe(true)

    // Verify initial content shows first status code
    expect(wrapper.text()).toContain('Success response')
    expect(wrapper.text()).toContain('status')
    expect(wrapper.text()).toContain('success')
  })

  it('handles multiple response codes without 200 or default', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '404': {
            description: 'Not found error',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { error: 'Resource not found' } },
                },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { error: 'Internal server error' } },
                },
              },
            },
          },
          '403': {
            description: 'Forbidden error',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { error: 'Access denied' } },
                },
              },
            },
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    expect(tabs.length).toBe(3)
    expect(tabs[0]?.text()).toContain('403')
    expect(tabs[1]?.text()).toContain('404')
    expect(tabs[2]?.text()).toContain('500')

    const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
    expect(codeBlock.exists()).toBe(true)

    // Verify initial content shows first status code (403)
    expect(wrapper.text()).toContain('Forbidden error')
    expect(wrapper.text()).toContain('error')
    expect(wrapper.text()).toContain('Access denied')
  })

  it('copies example response when clicking copy button', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                example: { foo: 'bar' },
              },
            },
          },
        },
      },
    })

    const copyButton = wrapper.find('.code-copy')
    expect(copyButton.exists()).toBe(true)

    await copyButton.trigger('click')

    expect(mockCopyToClipboard).toHaveBeenCalledWith('{\n  "foo": "bar"\n}')
  })

  it('copies the selected named example and follows response changes', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                examples: { first: { value: { id: 1 } }, second: { value: { id: 2 } } },
              },
            },
          },
          '404': {
            description: 'Missing',
            content: { 'application/json': { example: 'Not found' } },
          },
        },
      },
    })

    await wrapper.getComponent({ name: 'ExamplePicker' }).vm.$emit('update:modelValue', 'second')
    await wrapper.get('button[aria-label="Copy example value"]').trigger('click')
    expect(mockCopyToClipboard).toHaveBeenLastCalledWith('{\n  "id": 2\n}')
    expect(wrapper.getComponent({ name: 'ScalarCodeBlock' }).props('prettyPrintedContent')).toBe('{\n  "id": 2\n}')

    await wrapper.getComponent({ name: 'ExampleResponseTabList' }).vm.$emit('change', 1)
    await wrapper.get('button[aria-label="Copy example value"]').trigger('click')
    expect(mockCopyToClipboard).toHaveBeenLastCalledWith('Not found')
    expect(wrapper.getComponent({ name: 'ScalarCodeBlock' }).props('prettyPrintedContent')).toBe('Not found')
  })

  it.each([
    { value: 0, content: '0' },
    { value: false, content: 'false' },
    { value: '', content: '' },
  ])('copies the falsy example $value', async ({ value, content }) => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': { description: 'OK', content: { 'application/json': { example: value } } },
        },
      },
    })

    await wrapper.get('button[aria-label="Copy example value"]').trigger('click')
    expect(mockCopyToClipboard).toHaveBeenLastCalledWith(content)
    expect(wrapper.getComponent({ name: 'ScalarCodeBlock' }).props('prettyPrintedContent')).toBe(content)
  })

  it('copies a resolved example reference', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                examples: {
                  linked: { $ref: '#/components/examples/Linked', '$ref-value': { value: { linked: true } } },
                },
              },
            },
          },
        },
      },
    })

    await wrapper.get('button[aria-label="Copy example value"]').trigger('click')
    expect(mockCopyToClipboard).toHaveBeenLastCalledWith('{\n  "linked": true\n}')
  })

  it('copies the displayed generated example', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: coerceValue(SchemaObjectSchema, { type: 'string', example: 'Generated' }) },
            },
          },
        },
      },
    })

    await wrapper.get('button[aria-label="Copy example value"]').trigger('click')
    expect(mockCopyToClipboard).toHaveBeenLastCalledWith('Generated')
    expect(wrapper.getComponent({ name: 'ScalarCodeBlock' }).props('prettyPrintedContent')).toBe('Generated')
  })

  it('toggles between schema and example view', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Foobar',
                    },
                  },
                }),
              },
            },
          },
        },
      },
    })

    // Find the schema toggle checkbox
    const schemaToggle = wrapper.find('.scalar-card-checkbox-input')
    expect(schemaToggle.exists()).toBe(true)

    // Initially should show example
    expect(wrapper.text()).toContain('"message": "Foobar"')
    expect(wrapper.text()).not.toContain('type')
    expect(wrapper.text()).not.toContain('properties')

    // Toggle schema view
    await schemaToggle.setValue(true)

    // Should now show schema
    expect(wrapper.text()).toContain('type')
    expect(wrapper.text()).toContain('object')
    expect(wrapper.text()).toContain('properties')
    expect(wrapper.text()).not.toContain('"message": "Foobar"')

    // Toggle back to example view
    await schemaToggle.setValue(false)

    // Should show example again
    expect(wrapper.text()).toContain('"message": "Foobar"')
    expect(wrapper.text()).not.toContain('type')
    expect(wrapper.text()).not.toContain('properties')
  })

  it('renders wildcard mimetype correctly', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              '*/*': {
                examples: {
                  example1: { value: { message: 'Wildcard mimetype' } },
                },
              },
            },
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })

    expect(tabs.length).toBe(1)
    expect(tabs[0]?.text()).toContain('200')
    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('Wildcard mimetype')
  })

  it('handles deprecated example field when no examples array exists', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Success with deprecated example field',
            content: {
              'application/json': {
                example: { message: 'Hello from deprecated example field' },
              },
            },
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })

    expect(tabs.length).toBe(1)
    expect(tabs[0]?.text()).toContain('200')
    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('Hello from deprecated example field')
    expect(examplePicker.exists()).toBe(false)
  })

  it('prefers examples over deprecated example field', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Response with both examples and example',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { message: 'From examples array' } },
                },
                example: { message: 'From deprecated example field' },
              },
            },
          },
        },
      },
    })

    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })

    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('From examples array')
    expect(wrapper.text()).not.toContain('From deprecated example field')
  })

  it('handles deprecated example field with complex objects', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Complex example object',
            content: {
              'application/json': {
                example: {
                  user: {
                    id: 123,
                    name: 'John Doe',
                    email: 'john@example.com',
                  },
                  metadata: {
                    timestamp: '2024-01-01T00:00:00Z',
                    version: '1.0',
                  },
                },
              },
            },
          },
        },
      },
    })

    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })

    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
    expect(wrapper.text()).toContain('2024-01-01T00:00:00Z')
  })

  it('handles deprecated example field with arrays', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Array example',
            content: {
              'application/json': {
                example: [
                  { id: 1, name: 'Item 1' },
                  { id: 2, name: 'Item 2' },
                  { id: 3, name: 'Item 3' },
                ],
              },
            },
          },
        },
      },
    })

    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })

    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('Item 1')
    expect(wrapper.text()).toContain('Item 2')
    expect(wrapper.text()).toContain('Item 3')
  })

  it('handles deprecated example field with primitive values', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Primitive example',
            content: {
              'text/plain': {
                example: 'Simple string response',
              },
            },
          },
        },
      },
    })

    const codeBlock = wrapper.findAllComponents({ name: 'ScalarCodeBlock' })

    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('Simple string response')
  })

  it('handles stale selectedExampleKey when switching to response with single example', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Multiple examples',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { message: 'Example 1' } },
                  example2: { value: { message: 'Example 2' } },
                },
              },
            },
          },
          '201': {
            description: 'Single example',
            content: {
              'application/json': {
                examples: {
                  singleExample: { value: { message: 'Single Example' } },
                },
              },
            },
          },
        },
      },
    })

    // Initially on 200 with multiple examples
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })
    expect(examplePicker.exists()).toBe(true)

    // Select example2
    await examplePicker.vm.$emit('update:modelValue', 'example2')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Example 2')

    // Switch to 201 tab (single example)
    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    await tabs[1]?.trigger('click')
    await wrapper.vm.$nextTick()

    // Should show the single example, not fall back to schema
    expect(wrapper.text()).toContain('Single Example')
    expect(wrapper.text()).not.toContain('Example 2')
  })

  it('handles stale selectedExampleKey when switching to response with deprecated example field', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Multiple examples',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { message: 'Example 1' } },
                  example2: { value: { message: 'Example 2' } },
                },
              },
            },
          },
          '201': {
            description: 'Deprecated example field',
            content: {
              'application/json': {
                example: { message: 'Deprecated Example' },
              },
            },
          },
        },
      },
    })

    // Initially on 200 with multiple examples
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })
    expect(examplePicker.exists()).toBe(true)

    // Select example2
    await examplePicker.vm.$emit('update:modelValue', 'example2')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Example 2')

    // Switch to 201 tab (deprecated example field)
    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    await tabs[1]?.trigger('click')
    await wrapper.vm.$nextTick()

    // Should show the deprecated example, not fall back to schema
    expect(wrapper.text()).toContain('Deprecated Example')
    expect(wrapper.text()).not.toContain('Example 2')
  })

  it('handles stale selectedExampleKey when responses prop changes', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Multiple examples',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { message: 'Example 1' } },
                  example2: { value: { message: 'Example 2' } },
                },
              },
            },
          },
        },
      },
    })

    // Select example2
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })
    await examplePicker.vm.$emit('update:modelValue', 'example2')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Example 2')

    // Update responses prop to have only one example (no tab change)
    await wrapper.setProps({
      responses: {
        '200': {
          description: 'Single example now',
          content: {
            'application/json': {
              examples: {
                newExample: { value: { message: 'New Single Example' } },
              },
            },
          },
        },
      },
    })
    await wrapper.vm.$nextTick()

    // Should show the new example, not fail or show nothing
    expect(wrapper.text()).toContain('New Single Example')
    expect(wrapper.text()).not.toContain('Example 2')
  })

  it('keeps the document-wide example when the status code list shrinks and the index clamps', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        selectedExample: 'example2',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { message: 'TwoHundred One' } },
                  example2: { value: { message: 'TwoHundred Two' } },
                },
              },
            },
          },
          '404': {
            description: 'Not found',
            content: {
              'application/json': {
                examples: {
                  example2: { value: { message: 'NotFound Two' } },
                  example3: { value: { message: 'NotFound Three' } },
                },
              },
            },
          },
        },
      },
    })

    // Move to the second tab (404), which also defines example2
    const tabList = wrapper.findComponent({ name: 'ExampleResponseTabList' })
    await tabList.vm.$emit('change', 1)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('NotFound Two')

    // Drop the 404 response so the list shrinks and the index clamps back to 200
    await wrapper.setProps({
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              examples: {
                example1: { value: { message: 'TwoHundred One' } },
                example2: { value: { message: 'TwoHundred Two' } },
              },
            },
          },
        },
      },
    })
    await wrapper.vm.$nextTick()

    // The picker keeps the synced example (example2) instead of blanking out to the first one
    const examplePicker = wrapper.findComponent({ name: 'ExamplePicker' })
    expect(examplePicker.props('modelValue')).toBe('example2')
    expect(wrapper.text()).toContain('TwoHundred Two')
    expect(wrapper.text()).not.toContain('TwoHundred One')
  })

  it('renders explicit 204 response tab and shows No Body', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '204': {
            description: 'No Content',
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    expect(tabs.length).toBe(1)
    expect(tabs[0]?.text()).toContain('204')
    expect(wrapper.text()).toContain('No Body')
  })

  it('renders both contentful and explicit no-content responses', async () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { status: 'success' } },
                },
              },
            },
          },
          '204': {
            description: 'No Content',
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    expect(tabs.length).toBe(2)
    expect(tabs[0]?.text()).toContain('200')
    expect(tabs[1]?.text()).toContain('204')

    await tabs[1]?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No Body')
  })

  it('does not render tabs for non-response keys', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { status: 'success' } },
                },
              },
            },
          },
          metadata: {
            description: 'Internal metadata',
          },
        },
      },
    })

    const tabs = wrapper.findAllComponents({ name: 'ExampleResponseTab' })
    expect(tabs.length).toBe(1)
    expect(tabs[0]?.text()).toContain('200')
    expect(wrapper.text()).not.toContain('metadata')
  })
})
