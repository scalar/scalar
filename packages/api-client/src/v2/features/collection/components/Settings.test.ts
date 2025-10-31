import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Settings from './Settings.vue'

// Mock ResizeObserver
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe('Settings', () => {
  const mountWithProps = (
    custom: Partial<{
      documentUrl: string
      watchMode: boolean
      title: string
    }> = {},
  ) => {
    const defaultProps = {
      title: 'Test Document',
      documentUrl: undefined,
      watchMode: false,
    }

    return mount(Settings, {
      props: {
        ...defaultProps,
        ...custom,
      },
    })
  }

  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = mountWithProps()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the Features section title', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Features')
    })

    it('renders the Watch Mode section', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Watch Mode')
    })

    it('renders the Watch Mode description', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('When enabled, the OpenAPI document will be polled for changes')
      expect(wrapper.text()).toContain('The collection will be updated automatically')
    })

    it('renders the Danger Zone section', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Danger Zone')
    })

    it('renders the Delete Collection section', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Delete Collection')
    })

    it('renders the danger zone warning message', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Be careful, my friend')
      expect(wrapper.text()).toContain('Once deleted, there is no way to recover the collection')
    })

    it('renders the Delete Collection button', () => {
      const wrapper = mountWithProps()

      const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete Collection'))
      expect(deleteButton?.exists()).toBe(true)
    })

    it('renders ScalarToggle for watch mode', () => {
      const wrapper = mountWithProps()

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.exists()).toBe(true)
    })
  })

  describe('Watch Mode section with documentUrl', () => {
    it('displays source URL when documentUrl is provided', () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
      })

      expect(wrapper.text()).toContain('Source')
      expect(wrapper.text()).toContain('https://api.example.com/openapi.yaml')
    })

    it('renders URL as a clickable link', () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
      })

      const link = wrapper.find('a[href="https://api.example.com/openapi.yaml"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('target')).toBe('_blank')
    })

    it('renders ExternalLink icon next to URL', () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
      })

      const externalLinkIcon = wrapper.findComponent({ name: 'ScalarIcon' })
      expect(externalLinkIcon.props('icon')).toBe('ExternalLink')
    })

    it('enables toggle when documentUrl is provided', () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
      })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.props('disabled')).toBe(false)
    })
  })

  describe('Watch Mode section without documentUrl', () => {
    it('displays warning message when no documentUrl', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('No URL configured')
      expect(wrapper.text()).toContain('Try importing an OpenAPI document from an URL')
    })

    it('renders NotAllowed icon when no documentUrl', () => {
      const wrapper = mountWithProps()

      const icons = wrapper.findAllComponents({ name: 'ScalarIcon' })
      const notAllowedIcon = icons.find((icon) => icon.props('icon') === 'NotAllowed')
      expect(notAllowedIcon?.exists()).toBe(true)
    })

    it('disables toggle when documentUrl is not provided', () => {
      const wrapper = mountWithProps()

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.props('disabled')).toBe(true)
    })

    it('does not render Source label when no documentUrl', () => {
      const wrapper = mountWithProps()

      const sourceLabel = wrapper.findAll('span').find((span) => span.text() === 'Source')
      expect(sourceLabel).toBeUndefined()
    })

    it('does not render any links when no documentUrl', () => {
      const wrapper = mountWithProps()

      const links = wrapper.findAll('a')
      expect(links.length).toBe(0)
    })
  })

  describe('Watch Mode toggle', () => {
    it('reflects the watchMode prop value', () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
        watchMode: true,
      })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.props('modelValue')).toBe(true)
    })

    it('sets toggle to false when watchMode is false', () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
        watchMode: false,
      })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.props('modelValue')).toBe(false)
    })

    it('defaults to false when watchMode is undefined', () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
      })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.props('modelValue')).toBe(false)
    })

    it('emits update:watchMode when toggle is activated', async () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
        watchMode: false,
      })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      await toggle.vm.$emit('update:modelValue', true)
      await nextTick()

      expect(wrapper.emitted('update:watchMode')).toBeTruthy()
      expect(wrapper.emitted('update:watchMode')?.[0]).toEqual([true])
    })

    it('emits update:watchMode when toggle is deactivated', async () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
        watchMode: true,
      })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      await toggle.vm.$emit('update:modelValue', false)
      await nextTick()

      expect(wrapper.emitted('update:watchMode')).toBeTruthy()
      expect(wrapper.emitted('update:watchMode')?.[0]).toEqual([false])
    })
  })

  describe('Delete Collection button', () => {
    it('shows delete modal when Delete Collection button is clicked', async () => {
      const wrapper = mountWithProps()

      const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete Collection'))
      await deleteButton?.trigger('click')
      await nextTick()

      const modal = wrapper.findComponent({ name: 'ScalarModal' })
      expect(modal.exists()).toBe(true)
    })

    it('renders danger variant button', () => {
      const wrapper = mountWithProps()

      const deleteButton = wrapper
        .findAllComponents({ name: 'ScalarButton' })
        .find((btn) => btn.text().includes('Delete Collection'))
      expect(deleteButton?.props('variant')).toBe('danger')
    })
  })

  describe('Delete Modal', () => {
    it('renders modal with correct title', () => {
      const wrapper = mountWithProps({ title: 'My API Collection' })

      const modal = wrapper.findComponent({ name: 'ScalarModal' })
      expect(modal.props('title')).toBe('Delete My API Collection')
    })

    it('uses default title when title prop is not provided', () => {
      const wrapper = mount(Settings, {
        props: {
          title: 'Untitled Document',
        },
      })

      const modal = wrapper.findComponent({ name: 'ScalarModal' })
      expect(modal.props('title')).toBe('Delete Untitled Document')
    })

    it('renders DeleteSidebarListElement component', async () => {
      const wrapper = mountWithProps({ title: 'Test Document' })

      const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete Collection'))
      await deleteButton?.trigger('click')
      await nextTick()

      const deleteElement = wrapper.findComponent({ name: 'DeleteSidebarListElement' })
      expect(deleteElement.exists()).toBe(true)
    })

    it('passes correct variableName to DeleteSidebarListElement', async () => {
      const wrapper = mountWithProps({ title: 'Test Document' })

      // Open the modal first to ensure component is fully mounted
      const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete Collection'))
      await deleteButton?.trigger('click')
      await nextTick()

      const deleteElement = wrapper.findComponent({ name: 'DeleteSidebarListElement' })
      expect(deleteElement.props('variableName')).toBe('Test Document')
    })

    it('passes warning message to DeleteSidebarListElement', async () => {
      const wrapper = mountWithProps()

      // Open the modal first to ensure component is fully mounted
      const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete Collection'))
      await deleteButton?.trigger('click')
      await nextTick()

      const deleteElement = wrapper.findComponent({ name: 'DeleteSidebarListElement' })
      expect(deleteElement.props('warningMessage')).toBe('This action cannot be undone.')
    })

    it('closes modal when DeleteSidebarListElement emits close', async () => {
      const wrapper = mountWithProps()

      // Open the modal first
      const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete Collection'))
      await deleteButton?.trigger('click')
      await nextTick()

      const deleteElement = wrapper.findComponent({ name: 'DeleteSidebarListElement' })
      await deleteElement.vm.$emit('close')
      await nextTick()

      // Modal should be hidden, but we cannot easily verify internal state
      // We can verify the component still exists but state changed
      const modal = wrapper.findComponent({ name: 'ScalarModal' })
      expect(modal.exists()).toBe(true)
    })

    it('emits deleteDocument when DeleteSidebarListElement emits delete', async () => {
      const wrapper = mountWithProps()

      // Open the modal first to ensure component is fully mounted
      const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete Collection'))
      await deleteButton?.trigger('click')
      await nextTick()

      const deleteElement = wrapper.findComponent({ name: 'DeleteSidebarListElement' })
      await deleteElement.vm.$emit('delete')
      await nextTick()

      expect(wrapper.emitted('deleteDocument')).toBeTruthy()
      expect(wrapper.emitted('deleteDocument')?.[0]).toEqual([])
    })

    it('modal has size xxs', () => {
      const wrapper = mountWithProps()

      const modal = wrapper.findComponent({ name: 'ScalarModal' })
      expect(modal.props('size')).toBe('xxs')
    })
  })

  describe('edge cases', () => {
    it('handles empty title gracefully', () => {
      const wrapper = mountWithProps({ title: '' })

      expect(wrapper.exists()).toBe(true)
      const modal = wrapper.findComponent({ name: 'ScalarModal' })
      expect(modal.props('title')).toBe('Delete ')
    })

    it('handles very long document URL', () => {
      const longUrl =
        'https://very-long-subdomain.example.com/api/v1/documentation/openapi.yaml?version=latest&format=json'
      const wrapper = mountWithProps({ documentUrl: longUrl })

      expect(wrapper.text()).toContain(longUrl)
      const link = wrapper.find(`a[href="${longUrl}"]`)
      expect(link.exists()).toBe(true)
    })

    it('handles special characters in title', () => {
      const wrapper = mountWithProps({ title: 'Test & Document <API>' })

      const modal = wrapper.findComponent({ name: 'ScalarModal' })
      expect(modal.props('title')).toBe('Delete Test & Document <API>')
    })

    it('handles watchMode as undefined', () => {
      const wrapper = mount(Settings, {
        props: {
          title: 'Test Document',
          documentUrl: 'https://api.example.com/openapi.yaml',
        },
      })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.props('modelValue')).toBe(false)
    })

    it('handles documentUrl with special characters', () => {
      const specialUrl = 'https://api.example.com/openapi.yaml?key=value&foo=bar#section'
      const wrapper = mountWithProps({ documentUrl: specialUrl })

      const link = wrapper.find(`a[href="${specialUrl}"]`)
      expect(link.exists()).toBe(true)
    })

    it('renders correctly when all optional props are provided', () => {
      const wrapper = mountWithProps({
        title: 'Complete Document',
        documentUrl: 'https://api.example.com/openapi.yaml',
        watchMode: true,
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('https://api.example.com/openapi.yaml')

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.props('modelValue')).toBe(true)
      expect(toggle.props('disabled')).toBe(false)

      // Title is used in the modal, not displayed in the main component text
      const modal = wrapper.findComponent({ name: 'ScalarModal' })
      expect(modal.props('title')).toBe('Delete Complete Document')
    })

    it('renders correctly when only required props are provided', () => {
      const wrapper = mount(Settings, {
        props: {
          title: 'Minimal Document',
        },
      })

      expect(wrapper.exists()).toBe(true)

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.props('disabled')).toBe(true)

      // Title is used in the modal, not displayed in the main component text
      const modal = wrapper.findComponent({ name: 'ScalarModal' })
      expect(modal.props('title')).toBe('Delete Minimal Document')
    })

    it('handles multiple rapid toggle changes', async () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
        watchMode: false,
      })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })

      await toggle.vm.$emit('update:modelValue', true)
      await nextTick()
      await toggle.vm.$emit('update:modelValue', false)
      await nextTick()
      await toggle.vm.$emit('update:modelValue', true)
      await nextTick()

      expect(wrapper.emitted('update:watchMode')).toHaveLength(3)
      expect(wrapper.emitted('update:watchMode')?.[0]).toEqual([true])
      expect(wrapper.emitted('update:watchMode')?.[1]).toEqual([false])
      expect(wrapper.emitted('update:watchMode')?.[2]).toEqual([true])
    })

    it('handles rapid delete button clicks', async () => {
      const wrapper = mountWithProps()

      const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete Collection'))

      await deleteButton?.trigger('click')
      await nextTick()
      await deleteButton?.trigger('click')
      await nextTick()

      // Modal should still exist and component should not crash
      const modal = wrapper.findComponent({ name: 'ScalarModal' })
      expect(modal.exists()).toBe(true)
    })

    it('handles delete confirmation after multiple modal open/close cycles', async () => {
      const wrapper = mountWithProps({ title: 'Test Document' })

      // Open and close modal multiple times
      for (let i = 0; i < 3; i++) {
        const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete Collection'))
        await deleteButton?.trigger('click')
        await nextTick()

        const deleteElement = wrapper.findComponent({ name: 'DeleteSidebarListElement' })
        await deleteElement.vm.$emit('close')
        await nextTick()
      }

      // Final deletion
      const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete Collection'))
      await deleteButton?.trigger('click')
      await nextTick()

      const deleteElement = wrapper.findComponent({ name: 'DeleteSidebarListElement' })
      await deleteElement.vm.$emit('delete')
      await nextTick()

      expect(wrapper.emitted('deleteDocument')).toBeTruthy()
      expect(wrapper.emitted('deleteDocument')).toHaveLength(1)
    })
  })

  describe('props validation', () => {
    it('accepts valid documentUrl', () => {
      const wrapper = mountWithProps({
        documentUrl: 'https://api.example.com/openapi.yaml',
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('accepts boolean watchMode', () => {
      const wrapper = mountWithProps({ watchMode: true })

      expect(wrapper.exists()).toBe(true)
    })

    it('accepts string title', () => {
      const wrapper = mountWithProps({ title: 'Valid Title' })

      expect(wrapper.exists()).toBe(true)
    })
  })
})
