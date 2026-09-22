import { autoUpdate } from '@floating-ui/vue'
import { type VueWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ScalarFloating from './ScalarFloating.vue'

vi.mock('@floating-ui/vue', async (importOriginal) => {
  const original = await importOriginal<typeof import('@floating-ui/vue')>()
  return { ...original, autoUpdate: vi.fn(original.autoUpdate) }
})

enableAutoUnmount(afterEach)

describe('ScalarFloating', () => {
  let wrapper: VueWrapper<InstanceType<typeof ScalarFloating>>
  let targetDiv: HTMLElement

  beforeEach(() => {
    // Create a target div for ID-based tests
    targetDiv = document.createElement('div')
    targetDiv.id = 'test-target'
    document.body.appendChild(targetDiv)

    return () => {
      targetDiv.remove()
    }
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

      // Should fallback to the wrapper div (the first child div)
      const wrapperDiv = wrapper.find('div').element
      expect(wrapper.vm.targetRef).toBe(wrapperDiv)
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

      // Should fallback to the wrapper div (the first child div)
      const wrapperDiv = wrapper.find('div').element
      expect(wrapper.vm.targetRef).toBe(wrapperDiv)
    })
  })

  describe('deferred positioning', () => {
    const slots = {
      default: '<button>Reference</button>',
      floating: '<div class="floating">Floating Content</div>',
    }

    beforeEach(() => {
      vi.mocked(autoUpdate).mockClear()
    })

    it('starts auto updating after the mount tick, not during it', async () => {
      wrapper = mount(ScalarFloating, { slots })

      expect(autoUpdate).not.toHaveBeenCalled()

      await nextTick()

      expect(autoUpdate).toHaveBeenCalledTimes(1)
    })

    it('positions the floating element once the tick has run', async () => {
      wrapper = mount(ScalarFloating, { slots })

      await flushPromises()

      const floating = wrapper.find('.floating').element.parentElement
      expect(floating?.style.position).toBe('absolute')
      expect(floating?.style.transform).toMatch(/^translate\(/)
    })

    it('does not start auto updating when unmounted before the tick', async () => {
      wrapper = mount(ScalarFloating, { slots })
      wrapper.unmount()

      await flushPromises()

      expect(autoUpdate).not.toHaveBeenCalled()
    })
  })
})
