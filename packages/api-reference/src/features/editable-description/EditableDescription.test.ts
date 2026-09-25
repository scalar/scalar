import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'

import EditableDescription from './EditableDescription.vue'
import { DESCRIPTION_EDITING_SYMBOL, EDIT_KEY_EXTENSION } from './use-editable-description'

type MountOptions = {
  target?: unknown
  value?: string | null
  callback?: ((event: { key: string; value: string }) => Promise<void> | void) | undefined
  slot?: string
}

const mountDescription = ({ target, value, callback, slot }: MountOptions) =>
  mount(EditableDescription, {
    props: { target, value },
    attrs: { class: 'from-call-site' },
    slots: slot ? { default: slot } : undefined,
    global: {
      provide: { [DESCRIPTION_EDITING_SYMBOL as symbol]: ref(callback) },
    },
  })

const editableTarget = () => reactive({ [EDIT_KEY_EXTENSION]: 'paths|/planets|get', description: 'All the planets' })

describe('EditableDescription', () => {
  describe('when editing is off', () => {
    it('renders the markdown and nothing else', () => {
      const wrapper = mountDescription({ target: { description: 'Plain **markdown**' } })

      expect(wrapper.find('.editable-description').exists()).toBe(false)
      expect(wrapper.find('button').exists()).toBe(false)
      expect(wrapper.find('strong').text()).toBe('markdown')
    })

    it('renders the markdown from `value` when given', () => {
      const wrapper = mountDescription({ target: { description: 'stored' }, value: 'shown instead' })

      expect(wrapper.text()).toContain('shown instead')
      expect(wrapper.text()).not.toContain('stored')
    })

    it('keeps the call site class on the markdown', () => {
      const wrapper = mountDescription({ target: { description: 'text' } })

      expect(wrapper.find('.from-call-site').exists()).toBe(true)
    })

    it('stays off when the target has a key but no callback is configured', () => {
      const wrapper = mountDescription({ target: editableTarget(), callback: undefined })

      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('stays off when a callback is configured but the target has no key', () => {
      const wrapper = mountDescription({ target: { description: 'text' }, callback: vi.fn() })

      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('wraps a custom read view in the call site class', () => {
      const wrapper = mountDescription({ target: { description: 'text' }, slot: '<em>custom</em>' })

      expect(wrapper.find('.from-call-site em').text()).toBe('custom')
    })
  })

  describe('when editing is on', () => {
    it('shows an edit control beside the description', () => {
      const wrapper = mountDescription({ target: editableTarget(), callback: vi.fn() })

      expect(wrapper.text()).toContain('All the planets')
      expect(wrapper.find('.editable-description-edit').exists()).toBe(true)
      expect(wrapper.find('.from-call-site').exists()).toBe(true)
    })

    it('shows a placeholder when there is no description yet', () => {
      const wrapper = mountDescription({
        target: { [EDIT_KEY_EXTENSION]: 'components|schemas|Planet|properties|name' },
        callback: vi.fn(),
      })

      expect(wrapper.text()).toContain('No description yet')
      expect(wrapper.find('.editable-description-edit').exists()).toBe(true)
    })

    it('opens an editor with the stored description, not the derived one', async () => {
      const wrapper = mountDescription({ target: editableTarget(), value: 'Derived text', callback: vi.fn() })

      await wrapper.find('.editable-description-edit').trigger('click')

      const textarea = wrapper.find('textarea')
      expect(textarea.exists()).toBe(true)
      expect(textarea.element.value).toBe('All the planets')
    })

    it('calls the callback with the key and the draft, then writes it back', async () => {
      const target = editableTarget()
      const callback = vi.fn().mockResolvedValue(undefined)
      const wrapper = mountDescription({ target, callback })

      await wrapper.find('.editable-description-edit').trigger('click')
      await wrapper.find('textarea').setValue('Every planet we know of')
      await wrapper.find('button[type="submit"], button:not(.editable-description-edit)').trigger('click')
      await flushPromises()

      expect(callback).toHaveBeenCalledWith({ key: 'paths|/planets|get', value: 'Every planet we know of' })
      expect(target.description).toBe('Every planet we know of')
      expect(wrapper.find('textarea').exists()).toBe(false)
      expect(wrapper.text()).toContain('Every planet we know of')
    })

    it('writes through a $ref so the shared object is updated', async () => {
      const component = reactive({ [EDIT_KEY_EXTENSION]: 'components|schemas|Planet', description: 'A planet' })
      const reference = { $ref: '#/components/schemas/Planet', '$ref-value': component }
      const callback = vi.fn()
      const wrapper = mountDescription({ target: reference, callback })

      await wrapper.find('.editable-description-edit').trigger('click')
      await wrapper.find('textarea').setValue('A world')
      await wrapper.find('button:not(.editable-description-edit)').trigger('click')
      await flushPromises()

      expect(callback).toHaveBeenCalledWith({ key: 'components|schemas|Planet', value: 'A world' })
      expect(component.description).toBe('A world')
    })

    it('keeps the draft and shows the error when the callback rejects', async () => {
      const target = editableTarget()
      const callback = vi.fn().mockRejectedValue(new Error('Refused by the host'))
      const wrapper = mountDescription({ target, callback })

      await wrapper.find('.editable-description-edit').trigger('click')
      await wrapper.find('textarea').setValue('Will not be saved')
      await wrapper.find('button:not(.editable-description-edit)').trigger('click')
      await flushPromises()

      expect(wrapper.find('textarea').element.value).toBe('Will not be saved')
      expect(wrapper.find('[role="alert"]').text()).toBe('Refused by the host')
      expect(target.description).toBe('All the planets')
    })

    it('falls back to a generic message when the error has none', async () => {
      const callback = vi.fn().mockRejectedValue(new Error(''))
      const wrapper = mountDescription({ target: editableTarget(), callback })

      await wrapper.find('.editable-description-edit').trigger('click')
      await wrapper.find('button:not(.editable-description-edit)').trigger('click')
      await flushPromises()

      expect(wrapper.find('[role="alert"]').text()).toBe('Could not save the description')
    })

    it('discards the draft on cancel', async () => {
      const target = editableTarget()
      const wrapper = mountDescription({ target, callback: vi.fn() })

      await wrapper.find('.editable-description-edit').trigger('click')
      await wrapper.find('textarea').setValue('Never mind')
      await wrapper
        .findAll('button')
        .find((button) => button.text() === 'Cancel')
        ?.trigger('click')

      expect(wrapper.find('textarea').exists()).toBe(false)
      expect(target.description).toBe('All the planets')
      expect(wrapper.text()).toContain('All the planets')
    })

    it('cancels on Escape and saves on Cmd+Enter', async () => {
      const callback = vi.fn()
      const wrapper = mountDescription({ target: editableTarget(), callback })

      await wrapper.find('.editable-description-edit').trigger('click')
      await wrapper.find('textarea').trigger('keydown', { key: 'Escape' })
      expect(wrapper.find('textarea').exists()).toBe(false)

      await wrapper.find('.editable-description-edit').trigger('click')
      await wrapper.find('textarea').setValue('Saved by keyboard')
      await wrapper.find('textarea').trigger('keydown', { key: 'Enter', metaKey: true })
      await flushPromises()
      await nextTick()

      expect(callback).toHaveBeenCalledWith({ key: 'paths|/planets|get', value: 'Saved by keyboard' })
    })
  })
})
