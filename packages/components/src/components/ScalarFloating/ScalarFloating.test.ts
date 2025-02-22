import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ScalarFloating from './ScalarFloating.vue'

describe('ScalarFloating', () => {
  let wrapper: any
  let targetDiv: HTMLElement

  beforeEach(() => {
    // Create a target div for ID-based tests
    targetDiv = document.createElement('div')
    targetDiv.id = 'test-target'
    document.body.appendChild(targetDiv)
  })

  // Cleanup after each test
  afterEach(() => {
    wrapper?.unmount()
    targetDiv.remove()
  })

  describe('floating target', () => {
    it('should find target by ID string', async () => {
      wrapper = mount(ScalarFloating, { props: { target: 'test-target' } })

      await nextTick()

      expect(wrapper.vm.targetRef).toBe(targetDiv)
    })

    it('should fallback to the wrapper if target ID is not found', async () => {
      const consoleSpy = vi.spyOn(console, 'warn')

      wrapper = mount(ScalarFloating, { props: { target: 'non-existent-id' } })

      await nextTick()

      expect(wrapper.vm.targetRef).toBe(wrapper.vm.wrapperRef)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('non-existent-id'))

      consoleSpy.mockRestore()
    })

    it('should use direct HTMLElement target', async () => {
      const directTarget = document.createElement('div')

      wrapper = mount(ScalarFloating, { props: { target: directTarget } })

      await nextTick()

      expect(wrapper.vm.targetRef).toBe(directTarget)

      directTarget.remove()
    })

    it('should fallback to first child of wrapper when no target specified', async () => {
      wrapper = mount(ScalarFloating, {
        props: {},
        slots: {
          default: '<div class="child">Target Content</div>',
          floating: '<div class="floating">Floating Content</div>',
        },
      })

      await nextTick()
      const childElement = wrapper.find('.child').element

      expect(wrapper.vm.targetRef).toBe(childElement)
    })

    it('should fallback to wrapper itself when no children present', async () => {
      wrapper = mount(ScalarFloating, { props: {} })

      await nextTick()

      expect(wrapper.vm.targetRef).toBe(wrapper.vm.wrapperRef)
    })
  })
})
