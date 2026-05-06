import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { CommandPaletteDocument } from '../hooks/use-command-palette-documents'
import CommandPaletteDocumentSelect from './CommandPaletteDocumentSelect.vue'

const documents: CommandPaletteDocument[] = [
  { id: 'standalone', label: 'Standalone Doc' },
  {
    id: 'acme-v1',
    label: 'Acme API',
    versions: [
      { id: 'acme-v1', label: '1.0.0' },
      { id: 'acme-v0', label: '0.9.0' },
    ],
  },
]

const findOptionsList = (wrapper: ReturnType<typeof mount>) => wrapper.findComponent({ name: 'ScalarComboboxOptions' })

describe('CommandPaletteDocumentSelect', () => {
  it('renders the placeholder when no document is selected', () => {
    const wrapper = mount(CommandPaletteDocumentSelect, {
      props: { documents, modelValue: undefined, placeholder: 'Pick a doc' },
    })

    expect(wrapper.text()).toContain('Pick a doc')
  })

  it('renders the document title for a flat row', () => {
    const wrapper = mount(CommandPaletteDocumentSelect, {
      props: { documents, modelValue: 'standalone' },
    })

    expect(wrapper.text()).toContain('Standalone Doc')
  })

  it('renders the document title and version for a version row', () => {
    const wrapper = mount(CommandPaletteDocumentSelect, {
      props: { documents, modelValue: 'acme-v0' },
    })

    expect(wrapper.text()).toContain('Acme API')
    expect(wrapper.text()).toContain('0.9.0')
  })

  it('emits the picked workspace document name when an option is selected', async () => {
    const wrapper = mount(CommandPaletteDocumentSelect, {
      props: { documents, modelValue: 'standalone' },
      attachTo: document.body,
    })

    // Open the combobox so the option list is rendered.
    await wrapper.find('button').trigger('click')

    const list = findOptionsList(wrapper)
    expect(list.exists()).toBe(true)

    await list.vm.$emit('update:modelValue', [{ id: 'acme-v0', label: '0.9.0', documentLabel: 'Acme API' }])

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['acme-v0'])

    wrapper.unmount()
  })

  it('groups multi-version documents and keeps singletons in the leading group', async () => {
    const wrapper = mount(CommandPaletteDocumentSelect, {
      props: { documents, modelValue: 'standalone' },
      attachTo: document.body,
    })

    // The option list is teleported and only mounted once the combobox opens.
    await wrapper.find('button').trigger('click')

    const list = findOptionsList(wrapper)
    const options = list.props('options') as Array<{ label: string; options: { id: string }[] }>

    expect(options).toHaveLength(2)
    expect(options[0]).toEqual({
      label: '',
      options: [{ id: 'standalone', label: 'Standalone Doc', documentLabel: 'Standalone Doc' }],
    })
    expect(options[1]?.label).toBe('Acme API')
    expect(options[1]?.options.map((o) => o.id)).toEqual(['acme-v1', 'acme-v0'])

    wrapper.unmount()
  })
})
