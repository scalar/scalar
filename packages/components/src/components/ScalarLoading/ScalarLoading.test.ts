import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { ScalarLoading, useLoadingState } from './'

describe('ScalarLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render when loader is not provided', () => {
    const wrapper = mount(ScalarLoading)

    expect(wrapper.find('.loader-wrapper').exists()).toBe(false)
    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('renders when loader is provided', () => {
    const loader = useLoadingState()
    loader.start()

    const wrapper = mount(ScalarLoading, { props: { loader } })

    expect(wrapper.find('.loader-wrapper').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders SVG with correct structure', () => {
    const loader = useLoadingState()
    loader.start()

    const wrapper = mount(ScalarLoading, { props: { loader } })
    const svg = wrapper.find('svg')

    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 100 100')
    expect(svg.classes()).toContain('svg-loader')
  })

  it('renders checkmark path elements', () => {
    const loader = useLoadingState()
    loader.start()

    const wrapper = mount(ScalarLoading, { props: { loader } })

    const checkmark = wrapper.find('.svg-check-mark')
    expect(checkmark.exists()).toBe(true)
    expect(checkmark.attributes('d')).toBe('m 0 60 l 30 30 l 70 -80')
  })

  it('renders X mark path elements', () => {
    const loader = useLoadingState()
    loader.start()

    const wrapper = mount(ScalarLoading, { props: { loader } })

    const xMarks = wrapper.findAll('.svg-x-mark')
    expect(xMarks.length).toBe(4)
  })

  it('shows circular loader when isLoading is true', () => {
    const loader = useLoadingState()
    loader.start()

    const wrapper = mount(ScalarLoading, { props: { loader } })

    const circularLoader = wrapper.find('.circular-loader')
    expect(circularLoader.exists()).toBe(true)

    const loaderPath = wrapper.find('.loader-path')
    expect(loaderPath.exists()).toBe(true)
    expect(loaderPath.classes()).not.toContain('loader-path-off')
  })

  it('applies loader-path-off class when isLoading is false', () => {
    const loader = useLoadingState()
    loader.start()
    // Manually set isLoading to false
    loader.isLoading = false

    const wrapper = mount(ScalarLoading, { props: { loader } })

    const loaderPath = wrapper.find('.loader-path')
    expect(loaderPath.exists()).toBe(true)
    expect(loaderPath.classes()).toContain('loader-path-off')
  })

  it('applies icon-is-valid class when isValid is true', async () => {
    const loader = useLoadingState()
    loader.validate()

    const wrapper = mount(ScalarLoading, { props: { loader } })

    await nextTick()

    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('icon-is-valid')
    expect(svg.classes()).not.toContain('icon-is-invalid')
  })

  it('applies icon-is-invalid class when isInvalid is true', async () => {
    const loader = useLoadingState()
    loader.invalidate()

    const wrapper = mount(ScalarLoading, { props: { loader } })

    await nextTick()

    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('icon-is-invalid')
    expect(svg.classes()).not.toContain('icon-is-valid')
  })

  it('applies loader-path-off class when not loading and valid', async () => {
    const loader = useLoadingState()
    loader.validate()
    // isValid is true, isLoading is false after validate

    const wrapper = mount(ScalarLoading, { props: { loader } })

    await nextTick()

    const loaderPath = wrapper.find('.loader-path')
    expect(loaderPath.exists()).toBe(true)
    expect(loaderPath.classes()).toContain('loader-path-off')
  })

  it('applies loader-path-off class when not loading and invalid', async () => {
    const loader = useLoadingState()
    loader.invalidate()
    // isInvalid is true, isLoading is false after invalidate

    const wrapper = mount(ScalarLoading, { props: { loader } })

    await nextTick()

    const loaderPath = wrapper.find('.loader-path')
    expect(loaderPath.exists()).toBe(true)
    expect(loaderPath.classes()).toContain('loader-path-off')
  })

  it('applies size classes correctly', () => {
    const loader = useLoadingState()
    loader.start()

    const wrapper = mount(ScalarLoading, {
      props: { loader, size: 'xl' },
    })

    const loaderWrapper = wrapper.find('.loader-wrapper')
    expect(loaderWrapper.classes()).toContain('size-6')
  })

  it('applies default size class when size is not provided', () => {
    const loader = useLoadingState()
    loader.start()

    const wrapper = mount(ScalarLoading, { props: { loader } })

    const loaderWrapper = wrapper.find('.loader-wrapper')
    expect(loaderWrapper.classes()).toContain('size-full')
  })

  it('updates DOM when loading state changes from loading to valid', async () => {
    const loader = useLoadingState()
    loader.start()

    const wrapper = mount(ScalarLoading, { props: { loader } })

    expect(wrapper.find('.circular-loader').exists()).toBe(true)
    expect(wrapper.find('svg').classes()).not.toContain('icon-is-valid')

    const validatePromise = loader.validate()

    await nextTick()
    expect(wrapper.find('svg').classes()).toContain('icon-is-valid')

    // When persist is false (default), validate calls clear() after 800ms, then clear() takes 300ms
    // Default duration is 1100ms, minus 300ms = 800ms
    await vi.advanceTimersByTimeAsync(800)
    await vi.advanceTimersByTimeAsync(300) // clear() duration
    await validatePromise

    await nextTick()
    // After validate completes with persist: false, clear() is called, so state is cleared
    expect(loader.isValid).toBe(false)
    expect(loader.isActive).toBe(false)
  })

  it('updates DOM when loading state changes from loading to invalid', async () => {
    const loader = useLoadingState()
    loader.start()

    const wrapper = mount(ScalarLoading, { props: { loader } })

    expect(wrapper.find('.circular-loader').exists()).toBe(true)
    expect(wrapper.find('svg').classes()).not.toContain('icon-is-invalid')

    const invalidatePromise = loader.invalidate()

    // Verify state is updated
    expect(loader.isInvalid).toBe(true)

    // Wait for Vue to update the DOM
    await nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('svg').classes()).toContain('icon-is-invalid')

    await vi.advanceTimersByTimeAsync(800)
    await vi.advanceTimersByTimeAsync(300) // clear() duration
    await invalidatePromise

    await nextTick()
    // After invalidate completes with persist: false, clear() is called, so state is cleared
    expect(loader.isInvalid).toBe(false)
  })

  it('removes classes when state is cleared', async () => {
    const loader = useLoadingState()
    const validatePromise = loader.validate({ persist: true })

    const wrapper = mount(ScalarLoading, { props: { loader } })

    await nextTick()
    await vi.advanceTimersByTimeAsync(1100)
    await validatePromise

    await nextTick()
    // With persist: true, state remains valid
    expect(wrapper.find('svg').classes()).toContain('icon-is-valid')

    const clearPromise = loader.clear()
    await nextTick()
    expect(wrapper.find('svg').classes()).not.toContain('icon-is-valid')
    expect(wrapper.find('svg').classes()).not.toContain('icon-is-invalid')

    await vi.advanceTimersByTimeAsync(300)
    await clearPromise

    await nextTick()
    expect(wrapper.find('svg').classes()).not.toContain('icon-is-valid')
    expect(wrapper.find('svg').classes()).not.toContain('icon-is-invalid')
  })

  it('handles all size variants', () => {
    const loader = useLoadingState()
    loader.start()

    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] as const

    sizes.forEach((size) => {
      const wrapper = mount(ScalarLoading, {
        props: { loader, size },
      })

      const loaderWrapper = wrapper.find('.loader-wrapper')
      expect(loaderWrapper.exists()).toBe(true)

      wrapper.unmount()
    })
  })

  it('maintains SVG structure across state changes', async () => {
    const loader = useLoadingState()
    loader.start()

    const wrapper = mount(ScalarLoading, { props: { loader } })

    const initialSvg = wrapper.find('svg')
    expect(initialSvg.exists()).toBe(true)
    expect(initialSvg.find('.svg-check-mark').exists()).toBe(true)
    expect(initialSvg.findAll('.svg-x-mark').length).toBe(4)

    loader.validate()
    await nextTick()
    await vi.advanceTimersByTimeAsync(800)

    const svgAfterValidate = wrapper.find('svg')
    expect(svgAfterValidate.exists()).toBe(true)
    expect(svgAfterValidate.find('.svg-check-mark').exists()).toBe(true)
    expect(svgAfterValidate.findAll('.svg-x-mark').length).toBe(4)

    loader.invalidate()
    await nextTick()
    await vi.advanceTimersByTimeAsync(800)

    const svgAfterInvalidate = wrapper.find('svg')
    expect(svgAfterInvalidate.exists()).toBe(true)
    expect(svgAfterInvalidate.find('.svg-check-mark').exists()).toBe(true)
    expect(svgAfterInvalidate.findAll('.svg-x-mark').length).toBe(4)
  })
})
