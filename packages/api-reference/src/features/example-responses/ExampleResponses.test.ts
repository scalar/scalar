import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ExampleResponses from './ExampleResponses.vue'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'

const mockCopyToClipboard = vi.fn()

vi.mock('@scalar/use-hooks/useClipboard', () => ({
  useClipboard: vi.fn(() => ({
    copyToClipboard: mockCopyToClipboard,
  })),
}))

describe('ExampleResponses', () => {
  it('renders a single example correctly', () => {
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                examples: {
                  example1: { value: { message: 'Success' } },
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
    expect(tabs[0].text()).toContain('200')
    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('Success')
    expect(wrapper.text()).not.toContain('value')
    expect(examplePicker.exists()).toBe(false)
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
                  example1: { value: { message: 'Example 1' } },
                  example2: { value: { message: 'Example 2' } },
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
    expect(tabs[0].text()).toContain('200')

    expect(codeBlock.length).toBe(1)
    expect(textSelectLabel.text()).toContain('example1')
    expect(codeBlock[0].text()).toContain('Example 1')
    expect(codeBlock[0].text()).not.toContain('Example 2')

    await examplePicker.vm.$emit('update:modelValue', 'example2')
    expect(wrapper.text()).not.toContain('Example 1')
    expect(wrapper.text()).toContain('Example 2')
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
    expect(tabs[0].text()).toContain('Status: 200')
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
    expect(tabs[0].text()).toContain('200')
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
    expect(tabs[0].text()).toContain('200')
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
    expect(tabs[0].text()).toContain('200')
    expect(tabs[1].text()).toContain('400')
    expect(tabs[2].text()).toContain('500')

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
    expect(tabs[0].text()).toContain('200')
    expect(tabs[1].text()).toContain('404')
    expect(tabs[2].text()).toContain('default')

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
    expect(tabs[0].text()).toContain('403')
    expect(tabs[1].text()).toContain('404')
    expect(tabs[2].text()).toContain('500')

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

    expect(mockCopyToClipboard).toHaveBeenCalledWith({ foo: 'bar' })
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
    expect(tabs[0].text()).toContain('200')
    expect(codeBlock.length).toBe(1)
    expect(wrapper.text()).toContain('Wildcard mimetype')
  })
})
