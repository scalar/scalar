import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, ref } from 'vue'

import { useScrollLock } from './use-scroll-lock'

describe('use-scroll-lock', () => {
  let element: HTMLDivElement

  beforeEach(() => {
    element = document.createElement('div')
  })

  it('locks scrolling and restores original overflow value on unmount', () => {
    const elementRef = ref(element)
    element.style.overflow = 'scroll'
    const scrollLock = useScrollLock(elementRef)

    scrollLock.value = true
    expect(element.style.overflow).toBe('hidden')

    scrollLock.value = false
    expect(element.style.overflow).toBe('scroll')
  })

  it('removes overflow property when unlocking if no initial value', () => {
    const elementRef = ref(element)
    const scrollLock = useScrollLock(elementRef)

    scrollLock.value = true
    expect(element.style.overflow).toBe('hidden')

    scrollLock.value = false
    expect(element.style.overflow).toBe('')
  })

  it('returns current lock state when reading', () => {
    const elementRef = ref(element)
    const scrollLock = useScrollLock(elementRef)

    expect(scrollLock.value).toBe(false)

    scrollLock.value = true
    expect(scrollLock.value).toBe(true)

    scrollLock.value = false
    expect(scrollLock.value).toBe(false)
  })

  it('handles null element gracefully when locking', () => {
    const elementRef = ref<HTMLElement | null>(null)
    const scrollLock = useScrollLock(elementRef)

    // Should not throw
    expect(() => {
      scrollLock.value = true
    }).not.toThrow()
  })

  it('handles null element gracefully when unlocking', () => {
    const elementRef = ref<HTMLElement | null>(null)
    const scrollLock = useScrollLock(elementRef)

    scrollLock.value = true

    // Should not throw
    expect(() => {
      scrollLock.value = false
    }).not.toThrow()
  })

  it('handles undefined element gracefully', () => {
    const elementRef = ref<HTMLElement | undefined>(undefined)
    const scrollLock = useScrollLock(elementRef)

    // Should not throw
    expect(() => {
      scrollLock.value = true
      scrollLock.value = false
    }).not.toThrow()
  })

  it('accepts a getter function as element', () => {
    const scrollLock = useScrollLock(() => element)

    scrollLock.value = true

    expect(element.style.overflow).toBe('hidden')
  })

  it('unlocks on component unmount when locked', () => {
    const Comp = defineComponent({
      setup() {
        const c = useScrollLock(element)
        return { c }
      },
    })

    const wrapper = mount(Comp)
    wrapper.vm.c = true

    expect(element.style.overflow).toBe('hidden')
    wrapper.unmount()

    expect(element.style.overflow).toBe('')
  })

  it('does not modify element on unmount when already unlocked', () => {
    element.style.overflow = 'auto'
    const Comp = defineComponent({
      setup() {
        useScrollLock(element)
      },
    })

    expect(element.style.overflow).toBe('auto')
    const wrapper = mount(Comp)
    wrapper.unmount()

    expect(element.style.overflow).toBe('auto')
  })
})
