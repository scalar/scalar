import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, readonly, ref } from 'vue'

import RequestBody from './RequestBody.vue'
import RequestTable from './RequestTable.vue'

// Mock the useFileDialog hook
const mockFiles = ref<FileList | null>(null)
const mockOpen = vi.fn()

vi.mock('@/hooks', () => ({
  useFileDialog: vi.fn((options) => {
    return {
      files: readonly(mockFiles),
      open: () => {
        mockOpen()
        // Simulate file selection if onChange is provided
        if (options?.onChange) {
          const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
          // Create a mock FileList
          const fileList = {
            0: mockFile,
            length: 1,
            item: (index: number) => (index === 0 ? mockFile : null),
            [Symbol.iterator]: function* () {
              yield mockFile
            },
          } as unknown as FileList
          // Call onChange synchronously
          options.onChange(fileList)
        }
      },
    }
  }),
}))

const defaultEnvironment: XScalarEnvironment = {
  color: 'blue',
  variables: [],
  description: 'Test Environment',
}

const defaultProps = {
  exampleKey: 'example-1',
  title: 'Request Body',
  environment: defaultEnvironment,
}

describe('RequestBody', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFiles.value = null
  })

  it('renders different content types and handles content type selection', async () => {
    const requestBody: RequestBodyObject = {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
          example: { name: 'test' },
        },
        'application/xml': {
          schema: {
            type: 'string',
          },
          example: '<root>test</root>',
        },
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              field1: { type: 'string' },
            },
          },
        },
        'application/x-www-form-urlencoded': {
          schema: {
            type: 'object',
            properties: {
              field1: { type: 'string' },
            },
          },
        },
        'application/octet-stream': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }

    const wrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody,
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
          CodeInput: {
            template: '<div data-testid="code-input"></div>',
            props: ['modelValue', 'language', 'environment'],
            emits: ['update:modelValue'],
          },
        },
      },
    })

    await nextTick()

    // Should default to first content type (application/json)
    // Check that CodeInput is rendered for JSON
    const codeInput = wrapper.find('[data-testid="code-input"]')
    expect(codeInput.exists()).toBe(true)

    // Change to XML by updating the requestBody prop
    await wrapper.setProps({
      requestBody: {
        ...requestBody,
        'x-scalar-selected-content-type': {
          'example-1': 'application/xml',
        },
      },
    })
    await nextTick()

    // Should still render CodeInput for XML
    const xmlCodeInput = wrapper.find('[data-testid="code-input"]')
    expect(xmlCodeInput.exists()).toBe(true)

    // Change to form data
    await wrapper.setProps({
      requestBody: {
        ...requestBody,
        'x-scalar-selected-content-type': {
          'example-1': 'multipart/form-data',
        },
      },
    })
    await nextTick()

    // Should render RequestTable for form data
    const requestTable = wrapper.findComponent(RequestTable)
    expect(requestTable.exists()).toBe(true)
    expect(requestTable.props('showUploadButton')).toBe(true)

    // Change to form URL encoded
    await wrapper.setProps({
      requestBody: {
        ...requestBody,
        'x-scalar-selected-content-type': {
          'example-1': 'application/x-www-form-urlencoded',
        },
      },
    })
    await nextTick()

    // Should render RequestTable for URL encoded
    const urlEncodedTable = wrapper.findComponent(RequestTable)
    expect(urlEncodedTable.exists()).toBe(true)
    expect(urlEncodedTable.props('showUploadButton')).toBe(false)

    // Change to binary
    await wrapper.setProps({
      requestBody: {
        ...requestBody,
        'x-scalar-selected-content-type': {
          'example-1': 'application/octet-stream',
        },
      },
    })
    await nextTick()

    // Binary should show file upload button when no file is selected
    expect(wrapper.html()).toContain('Select File')

    // Change to none
    await wrapper.setProps({
      requestBody: {
        ...requestBody,
        'x-scalar-selected-content-type': {
          'example-1': 'none',
        },
      },
    })
    await nextTick()

    expect(wrapper.html()).toContain('No Body')
  })

  it('handles form data operations: add, update, and delete rows with proper event emissions', async () => {
    const requestBody: RequestBodyObject = {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              field1: { type: 'string' },
              field2: { type: 'string' },
            },
          },
          example: {
            field1: 'value1',
            field2: 'value2',
          },
        },
      },
      'x-scalar-selected-content-type': {
        'example-1': 'multipart/form-data',
      },
    }

    const wrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody,
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
          RequestTable: {
            template: '<div data-testid="request-table"></div>',
            props: ['data', 'environment', 'showUploadButton'],
            emits: ['addRow', 'updateRow', 'deleteRow', 'removeFile', 'uploadFile'],
          },
        },
      },
    })

    await nextTick()

    // Get the RequestTable component
    const requestTable = wrapper.findComponent(RequestTable)

    // Test add row
    const addRowPayload = { name: 'field3', value: 'value3' }
    await requestTable.vm.$emit('upsertRow', 0, addRowPayload)
    await nextTick()

    // Check that update:formValue event was emitted
    const addRowEvents = wrapper.emitted('update:formValue')
    expect(addRowEvents).toBeTruthy()
    if (addRowEvents && addRowEvents.length > 0) {
      const lastEventArray = addRowEvents[addRowEvents.length - 1]
      const lastAddEvent = lastEventArray?.[0] as
        | {
            contentType: string
            payload: Array<{ name: string; value: string; isDisabled: boolean }>
          }
        | undefined
      if (lastAddEvent) {
        expect(lastAddEvent.contentType).toBe('multipart/form-data')
        expect(lastAddEvent.payload).toBeTruthy()
        expect(lastAddEvent.payload.some((row) => row.name === 'field3')).toBe(true)
      }
    }

    // Test update row
    await requestTable.vm.$emit('updateRow', 0, {
      name: 'updatedField1',
      value: 'updatedValue1',
    })
    await nextTick()

    // Check that update:formValue event was emitted
    const updateRowEvents = wrapper.emitted('update:formValue')
    expect(updateRowEvents).toBeTruthy()
    if (updateRowEvents && updateRowEvents.length > 0) {
      const lastEventArray = updateRowEvents[updateRowEvents.length - 1]
      const lastUpdateEvent = lastEventArray?.[0] as
        | {
            contentType: string
            payload: Array<{ name: string; value: string; isDisabled: boolean }>
          }
        | undefined
      if (lastUpdateEvent) {
        expect(lastUpdateEvent.contentType).toBe('multipart/form-data')
        expect(lastUpdateEvent.payload).toBeTruthy()
      }
    }

    // Test update row with isDisabled
    await requestTable.vm.$emit('updateRow', 1, { isDisabled: true })
    await nextTick()

    const disabledUpdateEvents = wrapper.emitted('update:formValue')
    expect(disabledUpdateEvents).toBeTruthy()

    // Test delete row
    await requestTable.vm.$emit('deleteRow', 0)
    await nextTick()

    const deleteEvents = wrapper.emitted('update:formValue')
    expect(deleteEvents).toBeTruthy()
  })

  it('handles example value conversion and content type watcher logic', async () => {
    // Test with string example
    const stringRequestBody: RequestBodyObject = {
      content: {
        'application/json': {
          schema: {
            type: 'string',
          },
          example: 'simple string value',
        },
      },
    }

    const stringWrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody: stringRequestBody,
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
          CodeInput: {
            template: '<div data-testid="code-input"></div>',
            props: ['modelValue', 'language', 'environment'],
            emits: ['update:modelValue'],
          },
        },
      },
    })

    await nextTick()

    // String value should be used directly - check CodeInput is rendered
    const stringCodeInput = stringWrapper.find('[data-testid="code-input"]')
    expect(stringCodeInput.exists()).toBe(true)

    // Test with object example
    const objectRequestBody: RequestBodyObject = {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
            },
          },
          example: {
            id: 123,
            name: 'Test Object',
            tags: ['tag1', 'tag2'],
          },
        },
      },
    }

    const objectWrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody: objectRequestBody,
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
          CodeInput: {
            template: '<div data-testid="code-input"></div>',
            props: ['modelValue', 'language', 'environment'],
            emits: ['update:modelValue'],
          },
        },
      },
    })

    await nextTick()

    // Object value should be stringified - check CodeInput is rendered
    const objectCodeInput = objectWrapper.find('[data-testid="code-input"]')
    expect(objectCodeInput.exists()).toBe(true)

    // Test with no example (should return empty string)
    const noExampleRequestBody: RequestBodyObject = {
      content: {
        'application/json': {
          schema: {
            type: 'object',
          },
        },
      },
    }

    const noExampleWrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody: noExampleRequestBody,
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
          CodeInput: {
            template: '<div data-testid="code-input"></div>',
            props: ['modelValue', 'language', 'environment'],
            emits: ['update:modelValue'],
          },
        },
      },
    })

    await nextTick()

    // CodeInput should still be rendered even with no example
    const noExampleCodeInput = noExampleWrapper.find('[data-testid="code-input"]')
    expect(noExampleCodeInput.exists()).toBe(true)

    // Test content type watcher - should emit update:contentType when no selected type exists
    const watcherWrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody: objectRequestBody,
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
          CodeInput: {
            template: '<div data-testid="code-input"></div>',
            props: ['modelValue', 'language', 'environment'],
            emits: ['update:modelValue'],
          },
        },
      },
    })

    await nextTick()

    // Watcher should emit update:contentType with the default (first content type)
    const contentTypeEvents = watcherWrapper.emitted('update:contentType')
    expect(contentTypeEvents).toBeTruthy()
    if (contentTypeEvents && contentTypeEvents.length > 0 && contentTypeEvents[0]) {
      const firstEvent = contentTypeEvents[0][0] as { value: string }
      expect(firstEvent.value).toBe('application/json')
    }
  })

  it('handles edge cases: no request body, multiple content types, form data with array examples, and binary file deletion', async () => {
    // Test with no request body
    const noBodyWrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody: undefined,
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
        },
      },
    })

    await nextTick()

    // Should show "No Body" when no request body
    expect(noBodyWrapper.html()).toContain('No Body')

    // Test with multiple content types - should default to first
    const multiContentTypeBody: RequestBodyObject = {
      content: {
        'application/yaml': {
          schema: { type: 'string' },
          example: 'yaml: value',
        },
        'application/json': {
          schema: { type: 'object' },
          example: { json: 'value' },
        },
        'application/xml': {
          schema: { type: 'string' },
          example: '<xml>value</xml>',
        },
      },
    }

    const multiWrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody: multiContentTypeBody,
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
          CodeInput: {
            template: '<div data-testid="code-input"></div>',
            props: ['modelValue', 'language', 'environment'],
            emits: ['update:modelValue'],
          },
        },
      },
    })

    await nextTick()

    // Should default to first content type (yaml) - CodeInput should be rendered
    const yamlCodeInput = multiWrapper.find('[data-testid="code-input"]')
    expect(yamlCodeInput.exists()).toBe(true)

    // Test form data with array example (already in form row format)
    const arrayFormBody: RequestBodyObject = {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
          },
          example: [
            { name: 'field1', value: 'value1', isDisabled: false },
            { name: 'field2', value: 'value2', isDisabled: true },
          ],
        },
      },
      'x-scalar-selected-content-type': {
        'example-1': 'multipart/form-data',
      },
    }

    const arrayFormWrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody: arrayFormBody,
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
          RequestTable: {
            template: '<div data-testid="request-table"></div>',
            props: ['data', 'environment', 'showUploadButton'],
            emits: ['addRow', 'updateRow', 'deleteRow', 'removeFile', 'uploadFile'],
          },
        },
      },
    })

    await nextTick()

    // Should render RequestTable for array form data
    const arrayRequestTable = arrayFormWrapper.findComponent(RequestTable)
    expect(arrayRequestTable.exists()).toBe(true)

    // Test binary file deletion
    const binaryWithFileBody: RequestBodyObject = {
      content: {
        'application/octet-stream': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      'x-scalar-selected-content-type': {
        'example-1': 'application/octet-stream',
      },
    }

    const binaryDeleteWrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody: binaryWithFileBody,
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
        },
      },
    })

    await nextTick()

    // Simulate having a file selected by setting example with a file
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await binaryDeleteWrapper.setProps({
      requestBody: {
        ...binaryWithFileBody,
        content: {
          'application/octet-stream': {
            schema: {
              type: 'string',
              format: 'binary',
            },
            example: mockFile,
          },
        },
      },
    })

    await nextTick()

    // Find delete button and trigger it
    const deleteButtons = binaryDeleteWrapper.findAll('button')
    const deleteButton = deleteButtons.find((btn) => btn.text().includes('Delete'))

    if (deleteButton) {
      await deleteButton.trigger('click')
      await nextTick()

      // Should emit update:value with undefined payload
      const deleteEvents = binaryDeleteWrapper.emitted('update:value')
      expect(deleteEvents).toBeTruthy()
      if (deleteEvents && deleteEvents.length > 0) {
        const lastEventArray = deleteEvents[deleteEvents.length - 1]
        const lastDeleteEvent = lastEventArray?.[0] as
          | {
              payload: undefined
              contentType: string
            }
          | undefined
        if (lastDeleteEvent) {
          expect(lastDeleteEvent.payload).toBeUndefined()
          expect(lastDeleteEvent.contentType).toBe('application/octet-stream')
        }
      }
    }

    // Test CodeInput value updates emit update:value event
    const codeUpdateWrapper = mount(RequestBody, {
      props: {
        ...defaultProps,
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
              example: { test: 'value' },
            },
          },
        },
      },
      global: {
        stubs: {
          ScalarButton: {
            template: '<button><slot /></button>',
            props: ['variant', 'size', 'fullWidth'],
          },
          ScalarIcon: true,
          ScalarListbox: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'options', 'teleport'],
            emits: ['update:modelValue'],
          },
          CollapsibleSection: {
            template: '<div><slot name="title" /><slot /></div>',
          },
          DataTable: {
            template: '<div><slot /></div>',
          },
          DataTableHeader: {
            template: '<div><slot /></div>',
          },
          DataTableRow: {
            template: '<div><slot /></div>',
          },
          CodeInput: {
            template: '<div data-testid="code-input"></div>',
            props: ['modelValue', 'language', 'environment'],
            emits: ['update:modelValue'],
          },
        },
      },
    })

    await nextTick()

    const codeInput = codeUpdateWrapper.find('[data-testid="code-input"]')
    expect(codeInput.exists()).toBe(true)

    // Simulate CodeInput emitting update:modelValue
    const codeInputComponent = codeUpdateWrapper.findComponent({ name: 'CodeInput' })
    if (codeInputComponent.exists()) {
      await codeInputComponent.vm.$emit('update:modelValue', '{"updated": "value"}')
      await nextTick()

      const codeUpdateEvents = codeUpdateWrapper.emitted('update:value')
      expect(codeUpdateEvents).toBeTruthy()
      if (codeUpdateEvents && codeUpdateEvents.length > 0) {
        const lastEventArray = codeUpdateEvents[codeUpdateEvents.length - 1]
        const lastCodeEvent = lastEventArray?.[0] as
          | {
              payload: string
              contentType: string
            }
          | undefined
        if (lastCodeEvent) {
          expect(lastCodeEvent.payload).toBe('{"updated": "value"}')
          expect(lastCodeEvent.contentType).toBe('application/json')
        }
      }
    }
  })
})
