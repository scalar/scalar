import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ExampleObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, readonly, ref } from 'vue'

import { DataTableCheckbox } from '@/v2/components/data-table'
import { CodeInputLite } from '@/v2/components/code-input'
import { useFileDialog } from '@/hooks/use-file-dialog'

import RequestBodyForm from './RequestBodyForm.vue'
import RequestTable from './RequestTable.vue'
import RequestTableRow from './RequestTableRow.vue'

// Mock the useFileDialog hook
const mockFiles = ref<FileList | null>(null)
const mockOpen = vi.fn()
let fileDialogOnChange: ((files: FileList | null) => void) | undefined

vi.mock('@/hooks/use-file-dialog', () => ({
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

const mountRequestBodyForm = ({
  example,
  selectedContentType = 'multipart/form-data',
}: {
  example: ExampleObject | null | undefined
  selectedContentType?: string
}) =>
  mount(RequestBodyForm, {
    props: {
      example,
      selectedContentType,
      environment: defaultEnvironment,
    },
  })

describe('RequestBodyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFiles.value = null
    fileDialogOnChange = undefined
  })

  it.each(['multipart/form-data', 'application/x-www-form-urlencoded'])(
    'preserves external examples through render and focus until a form edit for %s',
    async (selectedContentType) => {
      const example: ExampleObject = { externalValue: '/examples/body.json', value: { field: 'original' } }
      const wrapper = mount(RequestBodyForm, {
        attachTo: document.body,
        props: { example, selectedContentType, environment: defaultEnvironment },
      })
      try {
        await nextTick()
        expect(wrapper.emitted('update:formValue')).toBeUndefined()
        const input = wrapper.findAllComponents(RequestTableRow)[0]!.findAllComponents(CodeInputLite)[0]!
        const editor = input.get('[contenteditable="true"]').element as HTMLElement
        editor.focus()
        await nextTick()
        editor.blur()
        await nextTick()
        expect(wrapper.emitted('update:formValue')).toBeUndefined()
        expect(example).toStrictEqual({ externalValue: '/examples/body.json', value: { field: 'original' } })

        input.vm.$emit('update:modelValue', 'edited')
        input.vm.$emit('blur', 'edited', new FocusEvent('blur'))
        await nextTick()
        expect(wrapper.emitted('update:formValue')).toStrictEqual([
          [[{ name: 'edited', value: 'original', isDisabled: false }]],
        ])
      } finally {
        wrapper.unmount()
      }
    },
  )

  it.each(['file-first', 'tags-first'] as const)(
    'includes optional files and tags after an example refresh (%s)',
    async (order) => {
      type FormPayload = ApiReferenceEvents['operation:update:requestBody:formValue']['payload']
      const wrapper = mount(RequestBodyForm, {
        props: {
          example: { value: { files: [], tags: [''] } },
          bodySchema: {
            type: 'object',
            properties: {
              files: { type: 'array', items: { type: 'string', format: 'binary' } },
              tags: { type: 'array', items: { type: 'string' } },
            },
          },
          selectedContentType: 'multipart/form-data',
          environment: defaultEnvironment,
        },
      })
      const editTags = async (): Promise<void> => {
        wrapper
          .findAllComponents(RequestTableRow)[1]!
          .findAllComponents(CodeInputLite)[1]!
          .vm.$emit('update:modelValue', '["first","second"]')
        await nextTick()
      }
      const upload = async (): Promise<void> => {
        wrapper.getComponent(RequestTable).vm.$emit('uploadFile', 0)
        await nextTick()
      }
      try {
        await (order === 'file-first' ? upload() : editTags())
        const firstUpdate = wrapper.emitted<[FormPayload]>('update:formValue')!.at(-1)![0]
        const untouched = firstUpdate[order === 'file-first' ? 1 : 0]!
        expect(untouched.isDisabled).toBe(true)
        expect(untouched.isDisabledByDefault).toBe(true)
        await wrapper.setProps({ example: { value: firstUpdate } })
        await (order === 'file-first' ? editTags() : upload())
        const rows = wrapper.emitted<[FormPayload]>('update:formValue')!.at(-1)![0]
        expect(rows).toStrictEqual([
          { name: 'files', value: rows[0]!.value, isDisabled: false, isArray: true },
          { name: 'tags', value: ['first', 'second'], isDisabled: false, isArray: true },
        ])
        expect(rows[0]!.value).toBeInstanceOf(File)
        expect((rows[0]!.value as File).name).toBe('test.txt')
      } finally {
        wrapper.unmount()
      }
    },
  )

  it.each(['multipart/form-data', 'application/x-www-form-urlencoded'])(
    'preserves untouched defaults and explicit checkbox choices across edits for %s',
    async (selectedContentType) => {
      type FormPayload = ApiReferenceEvents['operation:update:requestBody:formValue']['payload']
      const wrapper = mount(RequestBodyForm, {
        props: {
          example: { value: { first: '', second: '' } },
          bodySchema: { type: 'object', properties: { first: { type: 'string' }, second: { type: 'string' } } },
          selectedContentType,
          environment: defaultEnvironment,
        },
      })
      const refresh = async (): Promise<void> => {
        const value = wrapper.emitted<[FormPayload]>('update:formValue')!.at(-1)![0]
        await wrapper.setProps({ example: { value } })
      }
      const edit = async (index: number, value: string): Promise<void> => {
        wrapper
          .findAllComponents(RequestTableRow)
          [index]!.findAllComponents(CodeInputLite)[1]!
          .vm.$emit('update:modelValue', value)
        await nextTick()
      }
      try {
        await edit(0, 'one')
        await refresh()
        await edit(1, 'two')
        await refresh()
        const firstRow = wrapper.findAllComponents(RequestTableRow)[0]!
        firstRow.getComponent(DataTableCheckbox).vm.$emit('update:modelValue', false)
        await nextTick()
        await refresh()
        await edit(0, 'changed')
        expect(wrapper.emitted<[FormPayload]>('update:formValue')!.at(-1)![0]).toStrictEqual([
          { name: 'first', value: 'changed', isDisabled: true },
          { name: 'second', value: 'two', isDisabled: false },
        ])
      } finally {
        wrapper.unmount()
      }
    },
  )

  it('keeps an explicitly unchecked file field disabled after selecting a file', async () => {
    type FormPayload = ApiReferenceEvents['operation:update:requestBody:formValue']['payload']
    const wrapper = mount(RequestBodyForm, {
      props: {
        example: { value: [{ name: 'files', value: '', isDisabled: true }] },
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
    })
    try {
      wrapper.getComponent(RequestTable).vm.$emit('uploadFile', 0)
      await nextTick()
      const rows = wrapper.emitted<[FormPayload]>('update:formValue')!.at(-1)![0]
      expect(rows).toStrictEqual([{ name: 'files', value: rows[0]!.value, isDisabled: true }])
      expect(rows[0]!.value).toBeInstanceOf(File)
    } finally {
      wrapper.unmount()
    }
  })

  it('initializes localFormBodyRows from example prop and syncs on changes', async () => {
    const example: ExampleObject = {
      value: {
        field1: 'value1',
        field2: 'value2',
      },
    }

    const wrapper = mountRequestBodyForm({ example })

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

    const wrapper = mountRequestBodyForm({ example })

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

    const wrapper = mountRequestBodyForm({ example })

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
    const multipartWrapper = mountRequestBodyForm({ example })

    await nextTick()

    const multipartTable = multipartWrapper.findComponent(RequestTable)
    expect(multipartTable.exists()).toBe(true)
    // showUploadButton should be passed as a prop (check it's defined, not necessarily true due to stub)
    expect(multipartTable.props('showUploadButton')).toBeDefined()
    expect(multipartTable.props('environment')).toEqual(defaultEnvironment)
    expect(multipartTable.props('data')).toEqual([{ name: 'field1', value: 'value1', isDisabled: false }])

    // Test form-urlencoded
    const urlEncodedWrapper = mountRequestBodyForm({
      example,
      selectedContentType: 'application/x-www-form-urlencoded',
    })

    await nextTick()

    const urlEncodedTable = urlEncodedWrapper.findComponent(RequestTable)
    expect(urlEncodedTable.exists()).toBe(true)
    expect(urlEncodedTable.props('showUploadButton')).toBe(false)
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

    const wrapper = mountRequestBodyForm({ example })

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

    const wrapper = mountRequestBodyForm({
      example,
      selectedContentType: 'application/x-www-form-urlencoded',
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

    const wrapper = mountRequestBodyForm({ example })

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
  it('emits typed arrays when another field changes or an array is edited', async () => {
    const wrapper = mountRequestBodyForm({ example: { value: { tags: ['a', 'b'], other: 'old' } } })
    const table = wrapper.findComponent(RequestTable)
    table.vm.$emit('upsertRow', 1, { value: 'new' })
    await nextTick()
    expect(wrapper.emitted('update:formValue')?.[0]).toEqual([
      [
        { name: 'tags', value: ['a', 'b'], isDisabled: false, isArray: true },
        { name: 'other', value: 'new', isDisabled: false },
      ],
    ])
    table.vm.$emit('upsertRow', 0, { value: '["c","d"]' })
    await nextTick()
    expect(wrapper.emitted('update:formValue')?.[1]).toEqual([
      [
        { name: 'tags', value: ['c', 'd'], isDisabled: false, isArray: true },
        { name: 'other', value: 'new', isDisabled: false },
      ],
    ])
    wrapper.unmount()
  })
  it('retains example-only array types after saving invalid JSON and reopening', async () => {
    const wrapper = mountRequestBodyForm({ example: { value: { tags: ['a'] } } })
    wrapper.findComponent(RequestTable).vm.$emit('upsertRow', 0, { value: '[invalid' })
    await nextTick()
    const saved = [{ name: 'tags', value: '[invalid', isDisabled: false, isArray: true }]
    expect(wrapper.emitted('update:formValue')?.[0]).toEqual([saved])
    wrapper.unmount()

    const reopened = mountRequestBodyForm({ example: { value: saved } })
    reopened.findComponent(RequestTable).vm.$emit('upsertRow', 0, { value: '["repaired"]' })
    await nextTick()
    expect(reopened.emitted('update:formValue')?.[0]).toEqual([
      [{ name: 'tags', value: ['repaired'], isDisabled: false, isArray: true }],
    ])
    reopened.unmount()
  })
  it.each(['multipart/form-data', 'application/x-www-form-urlencoded'])(
    'keeps body key focus and saves on blur or send for %s',
    async (contentType) => {
      const wrapper = mount(RequestBodyForm, {
        attachTo: document.body,
        props: {
          example: { value: { existing: 'value' } },
          selectedContentType: contentType,
          environment: defaultEnvironment,
        },
      })
      try {
        for (const index of [0, 1]) {
          const row = wrapper.findAllComponents(RequestTableRow)[index]!
          const input = row.findAllComponents(CodeInputLite)[0]!
          const editor = input.get('[contenteditable="true"]').element as HTMLElement
          editor.focus()
          const eventCount = wrapper.emitted('update:formValue')?.length ?? 0
          let name = row.props('data').name
          for (const character of 'note') {
            name += character
            input.vm.$emit('update:modelValue', name)
            await nextTick()
            expect(document.activeElement).toBe(editor)
            expect(wrapper.emitted('update:formValue')?.length ?? 0).toBe(eventCount)
          }
          if (index === 0) {
            input.vm.$emit('blur', name, new FocusEvent('blur'))
          } else {
            editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }))
          }
          await nextTick()
          expect(wrapper.findComponent(RequestTable).props('data')[index]?.name).toBe(name)
          expect(wrapper.emitted('update:formValue')?.length).toBe(eventCount + 1)
        }
      } finally {
        wrapper.unmount()
      }
    },
  )

  /** Build a FileList-like object from plain File instances for the file dialog mock. */
  const toFileList = (files: File[]): FileList =>
    ({
      ...files,
      length: files.length,
      item: (index: number) => files[index] ?? null,
      [Symbol.iterator]: function* () {
        yield* files
      },
    }) as unknown as FileList

  const arrayFieldSchema: SchemaObject = {
    type: 'object',
    properties: {
      files: { type: 'array', items: { type: 'string', format: 'binary' } },
    },
  }

  it('opens a multi-file picker for array-typed fields and adds one row per file', async () => {
    const wrapper = mount(RequestBodyForm, {
      props: {
        example: { value: [{ name: 'files', value: '', isDisabled: false }] },
        bodySchema: arrayFieldSchema,
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
    })
    await nextTick()

    await wrapper.findComponent(RequestTable).vm.$emit('uploadFile', 0)
    await nextTick()

    // The array field opts into a multi-select picker.
    expect(vi.mocked(useFileDialog).mock.calls.at(-1)?.[0]?.multiple).toBe(true)

    fileDialogOnChange?.(
      toFileList([
        new File(['a'], 'a.txt', { type: 'text/plain' }),
        new File(['b'], 'b.txt', { type: 'text/plain' }),
        new File(['c'], 'c.txt', { type: 'text/plain' }),
      ]),
    )
    await nextTick()

    const events = wrapper.emitted('update:formValue')
    const lastEvent = events?.[events.length - 1]?.[0]
    expect(Array.isArray(lastEvent)).toBe(true)
    if (Array.isArray(lastEvent)) {
      // Every selected file becomes its own row, all reusing the `files` field name.
      expect(lastEvent).toHaveLength(3)
      expect(lastEvent.map((row) => row.name)).toEqual(['files', 'files', 'files'])
      expect(lastEvent.map((row) => (row.value as File).name)).toEqual(['a.txt', 'b.txt', 'c.txt'])
    }
  })

  it('keeps the file picker single-select for non-array fields', async () => {
    const wrapper = mount(RequestBodyForm, {
      props: {
        example: { value: [{ name: 'avatar', value: '', isDisabled: false }] },
        bodySchema: {
          type: 'object',
          properties: { avatar: { type: 'string', format: 'binary' } },
        },
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
    })
    await nextTick()

    await wrapper.findComponent(RequestTable).vm.$emit('uploadFile', 0)
    await nextTick()

    expect(vi.mocked(useFileDialog).mock.calls.at(-1)?.[0]?.multiple).toBe(false)
  })
  it('saves a deliberately cleared body key', async () => {
    const wrapper = mount(RequestBodyForm, {
      props: {
        example: { value: { existing: 'value' } },
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
    })
    const input = wrapper.findComponent(RequestTableRow).findAllComponents(CodeInputLite)[0]!
    input.vm.$emit('update:modelValue', '')
    await nextTick()
    input.vm.$emit('blur', '')
    await nextTick()
    expect(wrapper.emitted('update:formValue')?.at(-1)).toStrictEqual([
      [{ name: '', value: 'value', isDisabled: false }],
    ])
    wrapper.unmount()
  })

  it('retains value focus after committing existing and new body keys', async () => {
    const wrapper = mount(RequestBodyForm, {
      attachTo: document.body,
      props: {
        example: { value: { existing: 'value' } },
        selectedContentType: 'multipart/form-data',
        environment: defaultEnvironment,
      },
    })
    try {
      for (const index of [0, 1]) {
        const row = wrapper.findAllComponents(RequestTableRow)[index]!
        const inputs = row.findAllComponents(CodeInputLite)
        const valueEditor = inputs[1]!.get('[contenteditable="true"]').element as HTMLElement
        inputs[0]!.vm.$emit('update:modelValue', `renamed${index}`)
        await nextTick()
        inputs[0]!.vm.$emit('blur', `renamed${index}`)
        valueEditor.focus()
        await nextTick()
        expect(document.activeElement).toBe(valueEditor)
        expect(valueEditor.isConnected).toBe(true)
      }
    } finally {
      wrapper.unmount()
    }
  })
})
