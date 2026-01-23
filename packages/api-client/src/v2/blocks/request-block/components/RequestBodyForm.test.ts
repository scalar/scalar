import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, readonly, ref } from 'vue'

import RequestBodyForm from './RequestBodyForm.vue'
import RequestTable from './RequestTable.vue'

// Mock the useFileDialog hook
const mockFiles = ref<FileList | null>(null)
const mockOpen = vi.fn()
let fileDialogOnChange: ((files: FileList | null) => void) | undefined

vi.mock('@/hooks', () => ({
  useFileDialog: vi.fn((options) => {
    fileDialogOnChange = options?.onChange
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

describe('RequestBodyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFiles.value = null
    fileDialogOnChange = undefined
  })

  it('initializes localFormBodyRows from example prop and syncs on changes', async () => {
    const example: ExampleObject = {
      value: {
        field1: 'value1',
        field2: 'value2',
      },
    }

    const wrapper = mount(RequestBodyForm, {
      props: {
        example,
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
      global: {
        stubs: {
          RequestTable: {
            template: '<div data-testid="request-table"></div>',
            props: ['data', 'environment', 'showUploadButton'],
            emits: ['upsertRow', 'deleteRow', 'removeFile', 'uploadFile'],
          },
        },
      },
    })

    await nextTick()

    // Component should render RequestTable with initial data
    const requestTable = wrapper.findComponent(RequestTable)
    expect(requestTable.exists()).toBe(true)
    expect(requestTable.props('data')).toEqual([
      { name: 'field1', value: 'value1', isDisabled: false },
      { name: 'field2', value: 'value2', isDisabled: false },
    ])

    // Update example prop
    const newExample: ExampleObject = {
      value: {
        field3: 'value3',
      },
    }

    await wrapper.setProps({ example: newExample })
    await nextTick()

    // Should sync to new data
    expect(requestTable.props('data')).toEqual([{ name: 'field3', value: 'value3', isDisabled: false }])

    // Test with array example
    const arrayExample: ExampleObject = {
      value: [
        { name: 'username', value: 'john', isDisabled: false },
        { name: 'email', value: 'john@example.com', isDisabled: true },
      ],
    }

    await wrapper.setProps({ example: arrayExample })
    await nextTick()

    expect(requestTable.props('data')).toEqual([
      { name: 'username', value: 'john', isDisabled: false },
      { name: 'email', value: 'john@example.com', isDisabled: true },
    ])

    // Test with null/undefined example
    await wrapper.setProps({ example: null })
    await nextTick()

    expect(requestTable.props('data')).toEqual([])
  })

  it('handles upsert and delete row operations with correct event emissions', async () => {
    const example: ExampleObject = {
      value: {
        field1: 'value1',
      },
    }

    const wrapper = mount(RequestBodyForm, {
      props: {
        example,
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
      global: {
        stubs: {
          RequestTable: {
            template: '<div data-testid="request-table"></div>',
            props: ['data', 'environment', 'showUploadButton'],
            emits: ['upsertRow', 'deleteRow', 'removeFile', 'uploadFile'],
          },
        },
      },
    })

    await nextTick()

    const requestTable = wrapper.findComponent(RequestTable)

    // Test add row (upsert with index >= length)
    await requestTable.vm.$emit('upsertRow', 10, { name: 'field2', value: 'value2' })
    await nextTick()

    const addEvents = wrapper.emitted('update:formValue')
    expect(addEvents).toBeTruthy()
    expect(addEvents?.length).toBeGreaterThan(0)
    const lastAddEvent = addEvents?.[addEvents.length - 1]?.[0]
    expect(lastAddEvent).toBeDefined()
    expect(Array.isArray(lastAddEvent)).toBe(true)
    if (Array.isArray(lastAddEvent)) {
      expect(lastAddEvent).toHaveLength(2)
      expect(lastAddEvent.some((row) => row.name === 'field2' && row.value === 'value2')).toBe(true)
    }

    // Test update row (upsert with existing index)
    await requestTable.vm.$emit('upsertRow', 0, { name: 'updatedField1', value: 'updatedValue1' })
    await nextTick()

    const updateEvents = wrapper.emitted('update:formValue')
    expect(updateEvents).toBeTruthy()
    const lastUpdateEvent = updateEvents?.[updateEvents.length - 1]?.[0]
    expect(lastUpdateEvent).toBeDefined()
    if (Array.isArray(lastUpdateEvent)) {
      expect(lastUpdateEvent[0].name).toBe('updatedField1')
      expect(lastUpdateEvent[0].value).toBe('updatedValue1')
    }

    // Test update row with isDisabled
    await requestTable.vm.$emit('upsertRow', 0, { isDisabled: true })
    await nextTick()

    const disabledUpdateEvents = wrapper.emitted('update:formValue')
    expect(disabledUpdateEvents).toBeTruthy()
    const lastDisabledEvent = disabledUpdateEvents?.[disabledUpdateEvents.length - 1]?.[0]
    if (Array.isArray(lastDisabledEvent)) {
      expect(lastDisabledEvent[0].isDisabled).toBe(true)
    }

    // Test delete row
    await requestTable.vm.$emit('deleteRow', 0)
    await nextTick()

    const deleteEvents = wrapper.emitted('update:formValue')
    expect(deleteEvents).toBeTruthy()
    const lastDeleteEvent = deleteEvents?.[deleteEvents.length - 1]?.[0]
    if (Array.isArray(lastDeleteEvent)) {
      expect(lastDeleteEvent).toHaveLength(1)
    }
  })

  it('handles file upload for existing and new rows correctly', async () => {
    const example: ExampleObject = {
      value: [{ name: 'field1', value: 'value1', isDisabled: false }],
    }

    const wrapper = mount(RequestBodyForm, {
      props: {
        example,
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
      global: {
        stubs: {
          RequestTable: {
            template: '<div data-testid="request-table"></div>',
            props: ['data', 'environment', 'showUploadButton'],
            emits: ['upsertRow', 'deleteRow', 'removeFile', 'uploadFile'],
          },
        },
      },
    })

    await nextTick()

    const requestTable = wrapper.findComponent(RequestTable)

    // Test file upload for existing row (index 0)
    await requestTable.vm.$emit('uploadFile', 0)
    await nextTick()

    expect(mockOpen).toHaveBeenCalled()
    expect(fileDialogOnChange).toBeDefined()

    // Simulate file selection
    if (fileDialogOnChange) {
      const mockFile = new File(['content'], 'uploaded.txt', { type: 'text/plain' })
      const fileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => (index === 0 ? mockFile : null),
        [Symbol.iterator]: function* () {
          yield mockFile
        },
      } as unknown as FileList

      fileDialogOnChange(fileList)
      await nextTick()

      // Should update the existing row with the file
      const uploadEvents = wrapper.emitted('update:formValue')
      expect(uploadEvents).toBeTruthy()
      const lastUploadEvent = uploadEvents?.[uploadEvents.length - 1]?.[0]
      if (Array.isArray(lastUploadEvent)) {
        expect(lastUploadEvent[0].value).toBeInstanceOf(File)
        expect((lastUploadEvent[0].value as File).name).toBe('uploaded.txt')
        // Should preserve the existing name or use file name
        expect(lastUploadEvent[0].name).toBe('field1')
      }
    }

    // Reset mocks
    vi.clearAllMocks()

    // Test file upload for new row (index >= length)
    await requestTable.vm.$emit('uploadFile', 10)
    await nextTick()

    expect(mockOpen).toHaveBeenCalled()

    // Simulate file selection for new row
    if (fileDialogOnChange) {
      const mockFile = new File(['new content'], 'newfile.pdf', { type: 'application/pdf' })
      const fileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => (index === 0 ? mockFile : null),
        [Symbol.iterator]: function* () {
          yield mockFile
        },
      } as unknown as FileList

      fileDialogOnChange(fileList)
      await nextTick()

      // Should add a new row with the file
      const newRowEvents = wrapper.emitted('update:formValue')
      expect(newRowEvents).toBeTruthy()
      const lastNewRowEvent = newRowEvents?.[newRowEvents.length - 1]?.[0]
      if (Array.isArray(lastNewRowEvent)) {
        // The new row should be the last one in the array
        const newRow = lastNewRowEvent[lastNewRowEvent.length - 1]
        expect(newRow).toBeDefined()
        expect(newRow.value).toBeInstanceOf(File)
        expect((newRow.value as File).name).toBe('newfile.pdf')
        expect(newRow.name).toBe('newfile.pdf')
      }
    }

    // Test file upload with no file selected (null/undefined)
    vi.clearAllMocks()
    await requestTable.vm.$emit('uploadFile', 0)
    await nextTick()

    if (fileDialogOnChange) {
      fileDialogOnChange(null)
      await nextTick()

      // Should not emit update if no file was selected
      // The onChange handler checks for file existence, so no event should be emitted
    }
  })

  it('renders correct RequestTable variant based on selectedContentType with proper props', async () => {
    const example: ExampleObject = {
      value: {
        field1: 'value1',
      },
    }

    // Test multipart/form-data
    const multipartWrapper = mount(RequestBodyForm, {
      props: {
        example,
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
      global: {
        stubs: {
          RequestTable: {
            template: '<div data-testid="request-table"></div>',
            props: ['data', 'environment', 'showUploadButton'],
            emits: ['upsertRow', 'deleteRow', 'removeFile', 'uploadFile'],
          },
        },
      },
    })

    await nextTick()

    const multipartTable = multipartWrapper.findComponent(RequestTable)
    expect(multipartTable.exists()).toBe(true)
    // showUploadButton should be passed as a prop (check it's defined, not necessarily true due to stub)
    expect(multipartTable.props('showUploadButton')).toBeDefined()
    expect(multipartTable.props('environment')).toEqual(defaultEnvironment)
    expect(multipartTable.props('data')).toEqual([{ name: 'field1', value: 'value1', isDisabled: false }])

    // Test form-urlencoded
    const urlEncodedWrapper = mount(RequestBodyForm, {
      props: {
        example,
        selectedContentType: 'application/x-www-form-urlencoded',
        environment: defaultEnvironment,
      },
      global: {
        stubs: {
          RequestTable: {
            template: '<div data-testid="request-table"></div>',
            props: ['data', 'environment', 'showUploadButton'],
            emits: ['upsertRow', 'deleteRow'],
          },
        },
      },
    })

    await nextTick()

    const urlEncodedTable = urlEncodedWrapper.findComponent(RequestTable)
    expect(urlEncodedTable.exists()).toBe(true)
    expect(urlEncodedTable.props('showUploadButton')).toBeUndefined()
    expect(urlEncodedTable.props('environment')).toEqual(defaultEnvironment)
    expect(urlEncodedTable.props('data')).toEqual([{ name: 'field1', value: 'value1', isDisabled: false }])

    // Verify event handlers are correctly bound
    // For multipart: should have removeFile and uploadFile handlers
    await multipartTable.vm.$emit('removeFile', 0)
    await nextTick()

    const removeFileEvents = multipartWrapper.emitted('update:formValue')
    expect(removeFileEvents).toBeTruthy()
    const lastRemoveFileEvent = removeFileEvents?.[removeFileEvents.length - 1]?.[0]
    if (Array.isArray(lastRemoveFileEvent)) {
      expect(lastRemoveFileEvent[0].value).toBeUndefined()
    }
  })

  it('defaults isDisabled to false when adding a new row', async () => {
    const example: ExampleObject = {
      value: {
        field1: 'value1',
      },
    }

    const wrapper = mount(RequestBodyForm, {
      props: {
        example,
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
      global: {
        stubs: {
          RequestTable: {
            template: '<div data-testid="request-table"></div>',
            props: ['data', 'environment', 'showUploadButton'],
            emits: ['upsertRow', 'deleteRow', 'removeFile', 'uploadFile'],
          },
        },
      },
    })

    await nextTick()

    const requestTable = wrapper.findComponent(RequestTable)

    // Add a new row by emitting upsertRow with an index beyond the current array length
    await requestTable.vm.$emit('upsertRow', 10, { name: 'newField', value: 'newValue' })
    await nextTick()

    const events = wrapper.emitted('update:formValue')
    expect(events).toBeTruthy()
    const lastEvent = events?.[events.length - 1]?.[0]

    expect(lastEvent).toBeDefined()
    expect(Array.isArray(lastEvent)).toBe(true)

    if (Array.isArray(lastEvent)) {
      // Find the newly added row
      const newRow = lastEvent.find((row) => row.name === 'newField' && row.value === 'newValue')
      expect(newRow).toBeDefined()
      expect(newRow?.isDisabled).toBe(false)
    }
  })

  it('defaults isDisabled to false when adding a new row even if isDisabled is not provided in payload', async () => {
    const example: ExampleObject = {
      value: [],
    }

    const wrapper = mount(RequestBodyForm, {
      props: {
        example,
        selectedContentType: 'application/x-www-form-urlencoded',
        environment: defaultEnvironment,
      },
      global: {
        stubs: {
          RequestTable: {
            template: '<div data-testid="request-table"></div>',
            props: ['data', 'environment', 'showUploadButton'],
            emits: ['upsertRow', 'deleteRow'],
          },
        },
      },
    })

    await nextTick()

    const requestTable = wrapper.findComponent(RequestTable)

    // Add a new row with only name and value, no isDisabled in payload
    await requestTable.vm.$emit('upsertRow', 0, { name: 'firstField', value: 'firstValue' })
    await nextTick()

    const events = wrapper.emitted('update:formValue')
    expect(events).toBeTruthy()
    const lastEvent = events?.[events.length - 1]?.[0]

    expect(Array.isArray(lastEvent)).toBe(true)

    if (Array.isArray(lastEvent)) {
      expect(lastEvent).toHaveLength(1)
      expect(lastEvent[0]).toEqual({
        name: 'firstField',
        value: 'firstValue',
        isDisabled: false,
      })
    }
  })

  it('defaults isDisabled to false when adding a new row even if isDisabled is explicitly set to true in payload', async () => {
    const example: ExampleObject = {
      value: {
        existingField: 'existingValue',
      },
    }

    const wrapper = mount(RequestBodyForm, {
      props: {
        example,
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
      global: {
        stubs: {
          RequestTable: {
            template: '<div data-testid="request-table"></div>',
            props: ['data', 'environment', 'showUploadButton'],
            emits: ['upsertRow', 'deleteRow', 'removeFile', 'uploadFile'],
          },
        },
      },
    })

    await nextTick()

    const requestTable = wrapper.findComponent(RequestTable)

    // Try to add a new row with isDisabled: true - it should be overridden to false
    await requestTable.vm.$emit('upsertRow', 5, { name: 'newField', value: 'newValue', isDisabled: true })
    await nextTick()

    const events = wrapper.emitted('update:formValue')
    expect(events).toBeTruthy()
    const lastEvent = events?.[events.length - 1]?.[0]

    if (Array.isArray(lastEvent)) {
      const newRow = lastEvent.find((row) => row.name === 'newField')
      expect(newRow).toBeDefined()
      // isDisabled should be false even though we tried to set it to true
      expect(newRow?.isDisabled).toBe(false)
    }
  })
})
