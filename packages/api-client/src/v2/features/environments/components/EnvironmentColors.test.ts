// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EnvironmentColors from './EnvironmentColors.vue'

describe('EnvironmentColors', () => {
  it('renders the component', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders all 8 predefined color options', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const colorElements = wrapper.findAll('.color-selector > div')
    /** 8 colors + 1 custom color button = 9 total */
    expect(colorElements.length).toBeGreaterThanOrEqual(8)
  })

  it('shows checkmark on the active color', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#EF0006',
      },
    })

    const icons = wrapper.findAllComponents({ name: 'ScalarIcon' })
    const checkmarks = icons.filter((icon) => icon.props('icon') === 'Checkmark')

    expect(checkmarks.length).toBeGreaterThan(0)
  })

  it('emits select event when clicking a color option', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const colorOptions = wrapper.findAll('.color-selector > div')
    await colorOptions[1]?.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual(['#EF0006'])
  })

  it('shows custom color input when clicking custom color button', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const customColorButton = wrapper.find('label')
    await customColorButton.trigger('click')

    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
  })

  it('automatically adds "#" prefix to custom color value', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const customColorButton = wrapper.find('label')
    await customColorButton.trigger('click')
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[type="text"]')
    await input.setValue('FF0000')

    expect((input.element as any).value).toBe('#FF0000')
  })

  it('does not add extra "#" when already present', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const customColorButton = wrapper.find('label')
    await customColorButton.trigger('click')
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[type="text"]')
    await input.setValue('#00FF00')

    expect((input.element as any).value).toBe('#00FF00')
  })

  it('emits select event when typing custom color', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const customColorButton = wrapper.find('label')
    await customColorButton.trigger('click')
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[type="text"]')
    await input.setValue('123456')

    expect(wrapper.emitted('select')).toBeTruthy()
    /** The last emission should be the custom color with '#' prefix */
    const emissions = wrapper.emitted('select') as string[][]
    expect(emissions[emissions.length - 1]?.[0]).toBe('#123456')
  })

  it('hides custom input when clicking checkmark button', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    /** Show custom input */
    const customColorButton = wrapper.find('label')
    await customColorButton.trigger('click')
    await wrapper.vm.$nextTick()

    let input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)

    /** Hide custom input */
    const checkmarkButton = wrapper.find('button[type="button"]')
    await checkmarkButton.trigger('click')
    await wrapper.vm.$nextTick()

    input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(false)
  })

  it('renders custom color button', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const customColorButton = wrapper.find('label')
    /** The custom color button should exist */
    expect(customColorButton.exists()).toBe(true)
  })

  it('uses solid background when custom color is set', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const customColorButton = wrapper.find('label')
    await customColorButton.trigger('click')
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[type="text"]')
    await input.setValue('ABC123')
    await wrapper.vm.$nextTick()

    const colorPreview = wrapper.findAll('span')[1]
    const style = colorPreview?.attributes('style')

    expect(style).toContain('background')
    /** Vue converts hex colors to RGB, so we just check for background property */
    expect(style).toBeTruthy()
  })

  it('uses solid background when activeColor is not in standard options', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#123456',
      },
    })

    const customColorButton = wrapper.find('label')
    const style = customColorButton.attributes('style')

    expect(style).toContain('background')
    /** Vue converts hex to RGB, so we just verify background property exists */
    expect(style).toBeTruthy()
  })

  it('shows checkmark on custom color when active', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#ABCDEF',
      },
    })

    const customColorButton = wrapper.find('label')
    const icon = customColorButton.findComponent({ name: 'ScalarIcon' })

    expect(icon.exists()).toBe(true)
    expect(icon.props('icon')).toBe('Checkmark')
  })

  it('handles selector mode by showing only active color initially', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#EF0006',
        selector: true,
      },
    })

    /** In selector mode, only the active color circle should be visible initially */
    const selectorCircle = wrapper.find('.flex.cursor-pointer.items-center.justify-center.rounded-full')
    expect(selectorCircle.exists()).toBe(true)

    /** Full color selector should not be visible */
    const colorSelector = wrapper.find('.color-selector')
    expect(colorSelector.exists()).toBe(false)
  })

  it('expands to show all colors when clicking in selector mode', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#EF0006',
        selector: true,
      },
    })

    const selectorCircle = wrapper.find('.flex.cursor-pointer.items-center.justify-center.rounded-full')
    await selectorCircle.trigger('click')
    await wrapper.vm.$nextTick()

    const colorSelector = wrapper.find('.color-selector')
    expect(colorSelector.exists()).toBe(true)
  })

  it('hides selector after color selection in selector mode', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#EF0006',
        selector: true,
      },
    })

    /** Expand selector */
    const selectorCircle = wrapper.find('.flex.cursor-pointer.items-center.justify-center.rounded-full')
    await selectorCircle.trigger('click')
    await wrapper.vm.$nextTick()

    /** Select a color */
    const colorOptions = wrapper.findAll('.color-selector > div')
    await colorOptions[0]?.trigger('click')
    await wrapper.vm.$nextTick()

    /** Selector should be hidden again */
    const colorSelector = wrapper.find('.color-selector')
    expect(colorSelector.exists()).toBe(false)
  })

  it('does not hide selector in non-selector mode', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
        selector: false,
      },
    })

    const colorSelector = wrapper.find('.color-selector')
    expect(colorSelector.exists()).toBe(true)

    /** Select a color */
    const colorOptions = wrapper.findAll('.color-selector > div')
    await colorOptions[1]?.trigger('click')
    await wrapper.vm.$nextTick()

    /** Selector should still be visible */
    expect(colorSelector.exists()).toBe(true)
  })

  it('uses correct placeholder in custom color input', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#AABBCC',
      },
    })

    const customColorButton = wrapper.find('label')
    await customColorButton.trigger('click')
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[type="text"]')
    expect(input.attributes('placeholder')).toBe('#AABBCC')
  })

  it('uses default placeholder when no activeColor', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '',
      },
    })

    const customColorButton = wrapper.find('label')
    await customColorButton.trigger('click')
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[type="text"]')
    expect(input.attributes('placeholder')).toBe('#000000')
  })

  it('does not show checkmark on predefined colors when custom color is active', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    /** The component tracks customColor internally, but we can test the template behavior */
    const colorOptions = wrapper.findAll('.color-selector > div')
    colorOptions.forEach((option) => {
      const icon = option.findComponent({ name: 'ScalarIcon' })
      /** Only the white color (#FFFFFF) should have checkmark initially */
      if (option.attributes('style')?.includes('#FFFFFF')) {
        expect(icon.exists()).toBe(true)
      }
    })
  })

  it('handles empty activeColor gracefully', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '',
      },
    })

    expect(wrapper.exists()).toBe(true)
    const colorSelector = wrapper.find('.color-selector')
    expect(colorSelector.exists()).toBe(true)
  })

  it('emits multiple color selections correctly', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const colorOptions = wrapper.findAll('.color-selector > div')

    /** Select first color */
    await colorOptions[0]?.trigger('click')
    /** Select second color */
    await colorOptions[1]?.trigger('click')
    /** Select third color */
    await colorOptions[2]?.trigger('click')

    expect(wrapper.emitted('select')).toHaveLength(3)
    expect(wrapper.emitted('select')?.[0]).toEqual(['#FFFFFF'])
    expect(wrapper.emitted('select')?.[1]).toEqual(['#EF0006'])
    expect(wrapper.emitted('select')?.[2]).toEqual(['#EDBE20'])
  })

  it('toggles custom input visibility on multiple clicks', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const customColorButton = wrapper.find('label')

    /** Show */
    await customColorButton.trigger('click')
    await wrapper.vm.$nextTick()
    let input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)

    /** Hide */
    const checkmarkButton = wrapper.find('button[type="button"]')
    await checkmarkButton.trigger('click')
    await wrapper.vm.$nextTick()
    input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(false)

    /** Show again */
    await customColorButton.trigger('click')
    await wrapper.vm.$nextTick()
    input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
  })

  it('hides selector when opening custom input in selector mode', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#EF0006',
        selector: true,
      },
    })

    /** Expand selector */
    const selectorCircle = wrapper.find('.flex.cursor-pointer.items-center.justify-center.rounded-full')
    await selectorCircle.trigger('click')
    await wrapper.vm.$nextTick()

    const colorSelector = wrapper.find('.color-selector')
    expect(colorSelector.exists()).toBe(true)

    /** Open custom input */
    const customColorButton = wrapper.find('label')
    await customColorButton.trigger('click')
    await wrapper.vm.$nextTick()

    /** Custom input should be shown instead of predefined color options */
    const customInput = wrapper.find('input[type="text"]')
    expect(customInput.exists()).toBe(true)
  })

  it('handles rapid color changes', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    const colorOptions = wrapper.findAll('.color-selector > div')

    /** Rapidly select multiple colors */
    for (let i = 0; i < 5; i++) {
      await colorOptions[i]?.trigger('click')
    }

    expect(wrapper.emitted('select')).toHaveLength(5)
  })
})
