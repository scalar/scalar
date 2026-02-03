import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RequestTableTooltip from '@/v2/blocks/request-block/components/RequestTableTooltip.vue'
import { DataTableCheckbox } from '@/v2/components/data-table'

import RequestTableRow from './RequestTableRow.vue'

const environment = {
  description: 'Test Environment',
  variables: [],
  color: 'c',
}

describe('RequestTableRow', () => {
  it('renders with minimal props', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: '', value: '' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders with data', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'test-key', value: 'test-value' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    expect(codeInputs[0]?.props('modelValue')).toBe('test-key')
    expect(codeInputs[1]?.props('modelValue')).toBe('test-value')
  })

  it('displays checkbox when no globalRoute is provided', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'test', value: 'value' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.findComponent(DataTableCheckbox).exists()).toBe(true)
  })

  it('emits upsertRow when checkbox is toggled', async () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'test', value: 'value', isDisabled: false },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const checkbox = wrapper.findComponent(DataTableCheckbox)
    await checkbox.vm.$emit('update:modelValue', false)

    expect(wrapper.emitted('upsertRow')).toBeTruthy()
    expect(wrapper.emitted('upsertRow')?.[0]?.[0]).toMatchObject({
      name: 'test',
      value: 'value',
      isDisabled: true,
    })
  })

  it('disables checkbox when hasCheckboxDisabled is true', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'test', value: 'value' },
        environment,
        hasCheckboxDisabled: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const checkbox = wrapper.findComponent(DataTableCheckbox)
    expect(checkbox.props('disabled')).toBe(true)
  })

  it('emits upsertRow when key input changes', async () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'old-key', value: 'value' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const keyInput = wrapper.findAllComponents({ name: 'CodeInput' })[0]
    await keyInput?.vm.$emit('update:modelValue', 'new-key')

    expect(wrapper.emitted('upsertRow')).toBeTruthy()
    expect(wrapper.emitted('upsertRow')?.[0]?.[0]).toMatchObject({
      name: 'new-key',
      value: 'value',
      isDisabled: false,
    })
  })

  it('emits upsertRow when value input changes', async () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: 'old-value' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const valueInput = wrapper.findAllComponents({ name: 'CodeInput' })[1]
    await valueInput?.vm.$emit('update:modelValue', 'new-value')

    expect(wrapper.emitted('upsertRow')).toBeTruthy()
    expect(wrapper.emitted('upsertRow')?.[0]?.[0]).toMatchObject({
      name: 'key',
      value: 'new-value',
      isDisabled: false,
    })
  })

  it('disables inputs when isReadOnly is true', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: 'value', isReadonly: true },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    expect(codeInputs[0]?.props('disabled')).toBe(true)
    expect(codeInputs[1]?.props('disabled')).toBe(true)
  })

  it('displays tooltip when schema exists', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: {
          name: 'key',
          value: 'value',
          schema: { type: 'string' },
        },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.findComponent(RequestTableTooltip).exists()).toBe(true)
  })

  it('does not display tooltip when schema does not exist', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: 'value' },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.findComponent(RequestTableTooltip).exists()).toBe(false)
  })

  it('displays file upload button when showUploadButton is true', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: '' },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Select File')
  })

  it('emits uploadFile when upload button is clicked', async () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: '' },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const uploadButtons = wrapper.findAllComponents({ name: 'ScalarButton' })
    const uploadButton = uploadButtons.find((btn) => btn.text().includes('Select File'))
    await uploadButton?.vm.$emit('click')

    expect(wrapper.emitted('uploadFile')).toBeTruthy()
  })

  it('displays file name when value is a File instance', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('test.txt')
  })

  it('marks key input as required when isRequired is true', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: 'value', isRequired: true },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const keyInput = wrapper.findAllComponents({ name: 'CodeInput' })[0]
    expect(keyInput?.props('required')).toBe(true)
  })

  it('allows name changes when value is a File', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'old-name', value: file },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const keyInput = wrapper.findAllComponents({ name: 'CodeInput' })[0]
    await keyInput?.vm.$emit('update:modelValue', 'new-name')

    expect(wrapper.emitted('upsertRow')).toBeTruthy()
    expect(wrapper.emitted('upsertRow')?.[0]?.[0]).toMatchObject({
      name: 'new-name',
    })
  })

  it('allows checkbox changes when value is a File', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: file, isDisabled: false },
        environment,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const checkbox = wrapper.findComponent(DataTableCheckbox)
    await checkbox.vm.$emit('update:modelValue', false)

    expect(wrapper.emitted('upsertRow')).toBeTruthy()
    expect(wrapper.emitted('upsertRow')?.[0]?.[0]).toMatchObject({
      isDisabled: true,
    })
  })

  it('displays file name with proper formatting', () => {
    const file = new File(['content'], 'document.pdf', { type: 'application/pdf' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'attachment', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('document.pdf')
  })

  it('displays file name for files with special characters', () => {
    const file = new File(['content'], 'my-file (1).txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'file', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('my-file (1).txt')
  })

  it('displays file name for files with long names', () => {
    const longFileName = 'this-is-a-very-long-file-name-that-should-still-be-displayed-correctly.txt'
    const file = new File(['content'], longFileName, { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'file', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain(longFileName)
  })

  it('emits removeFile when delete button is clicked on a file', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    // Find the delete button within the file upload cell
    const deleteButtons = wrapper.findAll('button[type="button"]')
    const fileDeleteButton = deleteButtons.find((btn) => btn.text() === 'Delete')
    await fileDeleteButton?.trigger('click')

    expect(wrapper.emitted('removeFile')).toBeTruthy()
  })

  it('shows delete button when file is present', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const deleteButtons = wrapper.findAll('button[type="button"]')
    const fileDeleteButton = deleteButtons.find((btn) => btn.text() === 'Delete')
    expect(fileDeleteButton?.exists()).toBe(true)
    expect(fileDeleteButton?.text()).toBe('Delete')
  })

  it('does not show upload button when showUploadButton is false', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: '' },
        environment,
        showUploadButton: false,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).not.toContain('Select File')
  })

  it('handles file with empty name', () => {
    const file = new File(['content'], '', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('handles file with various MIME types', () => {
    const imageFile = new File(['content'], 'image.png', { type: 'image/png' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'image', value: imageFile },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('image.png')
  })

  it('handles JSON file type', () => {
    const jsonFile = new File(['{"key": "value"}'], 'data.json', {
      type: 'application/json',
    })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'data', value: jsonFile },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('data.json')
  })

  it('handles large file sizes', () => {
    const largeContent = new Array(1024 * 1024).fill('a').join('')
    const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'large', value: largeFile },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('large.txt')
  })

  it('preserves file when name is updated', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'old-name', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const keyInput = wrapper.findAllComponents({ name: 'CodeInput' })[0]
    await keyInput?.vm.$emit('update:modelValue', 'new-name')

    expect(wrapper.emitted('upsertRow')).toBeTruthy()
    const emittedData = wrapper.emitted('upsertRow')?.[0]?.[0] as {
      name: string
      value: string | File
      isDisabled: boolean
    }
    expect(emittedData).toMatchObject({
      name: 'new-name',
    })
    // Value should still be the file, not converted to string
    expect(emittedData?.value).toBe(file)
  })

  it('preserves file when checkbox is toggled', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: file, isDisabled: false },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const checkbox = wrapper.findComponent(DataTableCheckbox)
    await checkbox.vm.$emit('update:modelValue', false)

    expect(wrapper.emitted('upsertRow')).toBeTruthy()
    const emittedData = wrapper.emitted('upsertRow')?.[0]?.[0] as {
      name: string
      value: string | File
      isDisabled: boolean
    }
    expect(emittedData).toMatchObject({
      isDisabled: true,
    })
    // Value should still be the file
    expect(emittedData?.value).toBe(file)
  })

  it('shows Select File button when value is empty string', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: '' },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Select File')
  })

  it('switches from file display to Select File button after file removal', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    // Initially shows file name
    expect(wrapper.text()).toContain('test.txt')

    // After removing file, update props to empty value
    await wrapper.setProps({
      data: { name: 'key', value: '' },
    })

    // Should now show Select File button
    expect(wrapper.text()).toContain('Select File')
  })

  it('handles file with no extension', () => {
    const file = new File(['content'], 'README', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'readme', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('README')
  })

  it('handles file with multiple dots in name', () => {
    const file = new File(['content'], 'my.file.name.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'file', value: file },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('my.file.name.txt')
  })

  it('does not show delete row button when value is a required file', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'key', value: file, isRequired: true },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const deleteRowButtons = wrapper.findAllComponents({ name: 'ScalarButton' })
    const deleteRowButton = deleteRowButtons.find((btn) => {
      const iconComponent = btn.findComponent({ name: 'ScalarIconTrash' })
      return iconComponent.exists()
    })

    expect(deleteRowButton).toBeUndefined()
  })

  it('allows file upload on required field', () => {
    const wrapper = mount(RequestTableRow, {
      props: {
        data: { name: 'required-file', value: '', isRequired: true },
        environment,
        showUploadButton: true,
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Select File')
  })

  describe('enum handling', () => {
    it('passes enum values from schema to CodeInput', () => {
      const wrapper = mount(RequestTableRow, {
        props: {
          data: {
            name: 'status',
            value: 'active',
            schema: {
              type: 'string',
              enum: ['active', 'inactive', 'pending'],
            },
          },
          environment,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      })

      const valueInput = wrapper.findAllComponents({ name: 'CodeInput' })[1]
      expect(valueInput?.props('enum')).toEqual(['active', 'inactive', 'pending'])
    })

    it('returns empty array when schema has no enum', () => {
      const wrapper = mount(RequestTableRow, {
        props: {
          data: {
            name: 'name',
            value: 'test',
            schema: {
              type: 'string',
            },
          },
          environment,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      })

      const valueInput = wrapper.findAllComponents({ name: 'CodeInput' })[1]
      expect(valueInput?.props('enum')).toEqual([])
    })

    it('returns empty array when schema is not provided', () => {
      const wrapper = mount(RequestTableRow, {
        props: {
          data: {
            name: 'key',
            value: 'value',
          },
          environment,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      })

      const valueInput = wrapper.findAllComponents({ name: 'CodeInput' })[1]
      expect(valueInput?.props('enum')).toEqual([])
    })

    it('extracts enum from items schema for array types', () => {
      const wrapper = mount(RequestTableRow, {
        props: {
          data: {
            name: 'tags',
            value: 'tag1',
            schema: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['tag1', 'tag2', 'tag3'],
              },
            },
          },
          environment,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      })

      const valueInput = wrapper.findAllComponents({ name: 'CodeInput' })[1]
      expect(valueInput?.props('enum')).toEqual(['tag1', 'tag2', 'tag3'])
    })

    it('extracts enum from referenced items schema', () => {
      const wrapper = mount(RequestTableRow, {
        props: {
          data: {
            name: 'categories',
            value: 'electronics',
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Category',
                '$ref-value': { type: 'string' },
              },
            },
          },
          environment,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      })

      const valueInput = wrapper.findAllComponents({ name: 'CodeInput' })[1]
      // When items has a $ref, getResolvedRef should be called
      // We expect an empty array since we do not have a real ref resolver in tests
      expect(valueInput?.props('enum')).toEqual([])
    })

    it('returns empty array when items schema has no enum', () => {
      const wrapper = mount(RequestTableRow, {
        props: {
          data: {
            name: 'items',
            value: 'item1',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          environment,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      })

      const valueInput = wrapper.findAllComponents({ name: 'CodeInput' })[1]
      expect(valueInput?.props('enum')).toEqual([])
    })

    it('handles numeric enum values', () => {
      const wrapper = mount(RequestTableRow, {
        props: {
          data: {
            name: 'priority',
            value: '1',
            schema: {
              type: 'number',
              enum: [1, 2, 3, 4, 5],
            },
          },
          environment,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      })

      const valueInput = wrapper.findAllComponents({ name: 'CodeInput' })[1]
      // Enum values are converted to strings for display in the select dropdown
      expect(valueInput?.props('enum')).toEqual(['1', '2', '3', '4', '5'])
    })

    it('handles mixed type enum values', () => {
      const wrapper = mount(RequestTableRow, {
        props: {
          data: {
            name: 'mixed',
            value: 'value1',
            schema: {
              type: 'string',
              enum: ['value1', 2, null, true],
            },
          },
          environment,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      })

      const valueInput = wrapper.findAllComponents({ name: 'CodeInput' })[1]
      // Enum values are converted to strings for display in the select dropdown
      expect(valueInput?.props('enum')).toEqual(['value1', '2', 'null', 'true'])
    })

    it('handles empty enum array', () => {
      const wrapper = mount(RequestTableRow, {
        props: {
          data: {
            name: 'empty',
            value: '',
            schema: {
              type: 'string',
              enum: [],
            },
          },
          environment,
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      })

      const valueInput = wrapper.findAllComponents({ name: 'CodeInput' })[1]
      expect(valueInput?.props('enum')).toEqual([])
    })
  })
})
