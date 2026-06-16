import { type VueWrapper, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DocumentSettings from './DocumentSettings.vue'

/**
 * Finds a `<button>` whose trimmed text matches exactly. The settings
 * danger zone renders several buttons, so we cannot rely on order.
 */
const findButtonByText = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('button').find((button) => button.text().trim() === text)

const SOURCE_INPUT = 'input[placeholder="https://example.com/openapi.json"]'

describe('DocumentSettings', () => {
  describe('watch mode source', () => {
    it('renders the source url as a link', () => {
      const wrapper = mount(DocumentSettings, {
        props: {
          documentUrl: 'https://example.com/openapi.json',
          title: 'Test API',
        },
      })

      const link = wrapper.get('a')
      expect(link.attributes('href')).toBe('https://example.com/openapi.json')
      // The source is not editable until the user opts in.
      expect(wrapper.find(SOURCE_INPUT).exists()).toBe(false)
    })

    it('lets the user re-point the document at a different source', async () => {
      const wrapper = mount(DocumentSettings, {
        props: {
          documentUrl: 'https://example.com/openapi.json',
          title: 'Test API',
        },
      })

      await findButtonByText(wrapper, 'Edit')?.trigger('click')

      const input = wrapper.get(SOURCE_INPUT)
      await input.setValue('https://example.com/openapi/v1.json')
      await findButtonByText(wrapper, 'Save')?.trigger('click')

      expect(wrapper.emitted('update:documentUrl')).toEqual([['https://example.com/openapi/v1.json']])
    })

    it('trims the source before emitting', async () => {
      const wrapper = mount(DocumentSettings, {
        props: {
          documentUrl: 'https://example.com/openapi.json',
          title: 'Test API',
        },
      })

      await findButtonByText(wrapper, 'Edit')?.trigger('click')
      await wrapper.get(SOURCE_INPUT).setValue('  https://example.com/v2.json  ')
      await findButtonByText(wrapper, 'Save')?.trigger('click')

      expect(wrapper.emitted('update:documentUrl')).toEqual([['https://example.com/v2.json']])
    })

    it('does not emit when the source is unchanged', async () => {
      const wrapper = mount(DocumentSettings, {
        props: {
          documentUrl: 'https://example.com/openapi.json',
          title: 'Test API',
        },
      })

      await findButtonByText(wrapper, 'Edit')?.trigger('click')
      await findButtonByText(wrapper, 'Save')?.trigger('click')

      expect(wrapper.emitted('update:documentUrl')).toBeUndefined()
    })

    it('discards the draft when editing is cancelled', async () => {
      const wrapper = mount(DocumentSettings, {
        props: {
          documentUrl: 'https://example.com/openapi.json',
          title: 'Test API',
        },
      })

      await findButtonByText(wrapper, 'Edit')?.trigger('click')
      await wrapper.get(SOURCE_INPUT).setValue('https://example.com/nope.json')
      await findButtonByText(wrapper, 'Cancel')?.trigger('click')

      expect(wrapper.emitted('update:documentUrl')).toBeUndefined()
      // We are back to the read-only link.
      expect(wrapper.get('a').attributes('href')).toBe('https://example.com/openapi.json')
    })

    it('does not persist an empty source', async () => {
      const wrapper = mount(DocumentSettings, {
        props: {
          documentUrl: 'https://example.com/openapi.json',
          title: 'Test API',
        },
      })

      await findButtonByText(wrapper, 'Edit')?.trigger('click')
      await wrapper.get(SOURCE_INPUT).setValue('   ')

      // The Save button is disabled, and clicking it or pressing Enter
      // both bail rather than persisting an empty source.
      const saveButton = findButtonByText(wrapper, 'Save')
      expect(saveButton?.attributes('aria-disabled')).toBe('true')
      await saveButton?.trigger('click')
      await wrapper.get(SOURCE_INPUT).trigger('keydown.enter')

      expect(wrapper.emitted('update:documentUrl')).toBeUndefined()
    })

    it('seeds the editor from a source that updated while idle', async () => {
      const wrapper = mount(DocumentSettings, {
        props: {
          documentUrl: 'https://example.com/openapi.json',
          title: 'Test API',
        },
      })

      // The source is re-pointed elsewhere (for example by the store echo
      // of a previous save) while the editor is closed.
      await wrapper.setProps({
        documentUrl: 'https://example.com/openapi/v1.json',
      })

      await findButtonByText(wrapper, 'Edit')?.trigger('click')
      expect((wrapper.get(SOURCE_INPUT).element as HTMLInputElement).value).toBe('https://example.com/openapi/v1.json')
    })

    it('follows an async source update when the draft is untouched', async () => {
      const wrapper = mount(DocumentSettings, {
        props: {
          documentUrl: 'https://example.com/openapi.json',
          title: 'Test API',
        },
      })

      // Reopen Edit before the prop catches up, then let the store echo the
      // new url. Because the user has not typed anything, the editor follows
      // the incoming value instead of staying on the stale one.
      await findButtonByText(wrapper, 'Edit')?.trigger('click')
      await wrapper.setProps({
        documentUrl: 'https://example.com/openapi/v1.json',
      })

      expect((wrapper.get(SOURCE_INPUT).element as HTMLInputElement).value).toBe('https://example.com/openapi/v1.json')
    })

    it('keeps in-flight typing when the source updates elsewhere', async () => {
      const wrapper = mount(DocumentSettings, {
        props: {
          documentUrl: 'https://example.com/openapi.json',
          title: 'Test API',
        },
      })

      await findButtonByText(wrapper, 'Edit')?.trigger('click')
      await wrapper.get(SOURCE_INPUT).setValue('https://example.com/typing.json')

      // An external update must not clobber what the user is typing.
      await wrapper.setProps({
        documentUrl: 'https://example.com/openapi/v1.json',
      })

      expect((wrapper.get(SOURCE_INPUT).element as HTMLInputElement).value).toBe('https://example.com/typing.json')
    })

    it('lets the user add a source when none is configured', async () => {
      const wrapper = mount(DocumentSettings, {
        props: {
          title: 'Test API',
        },
      })

      // No link until a source exists.
      expect(wrapper.find('a').exists()).toBe(false)

      await findButtonByText(wrapper, 'Add')?.trigger('click')
      await wrapper.get(SOURCE_INPUT).setValue('https://example.com/openapi.json')
      await findButtonByText(wrapper, 'Save')?.trigger('click')

      expect(wrapper.emitted('update:documentUrl')).toEqual([['https://example.com/openapi.json']])
    })
  })
})
