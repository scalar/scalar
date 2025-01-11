import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import ScalarColorModeToggle from './ScalarColorModeToggle.vue'

// Mock the useColorMode hook
const mockUseColorMode = vi.fn()

vi.mock('@scalar/use-hooks/useColorMode', () => ({
  useColorMode: () => mockUseColorMode(),
}))

describe('ScalarColorModeToggle', () => {
  it('toggles dark mode when switch variant is clicked', async () => {
    const mockSetIsDarkMode = vi.fn()
    mockUseColorMode.mockImplementation(() => ({
      isDarkMode: computed({
        get: () => true,
        set: mockSetIsDarkMode,
      }),
      toggleColorMode: vi.fn(),
      darkLightMode: 'dark',
    }))

    const wrapper = mount(ScalarColorModeToggle)

    // Simulate v-model update from button component
    await wrapper.get('button').trigger('click')

    // Should trigger the isDarkMode setter which calls setColorMode
    expect(mockSetIsDarkMode).toHaveBeenCalled()
  })

  it('toggles dark mode when icon variant is clicked', async () => {
    // Create a mock function for toggleColorMode
    const mockToggleColorMode = vi.fn()

    // Setup the mock implementation with a ref for isDarkMode
    mockUseColorMode.mockReturnValue({
      isDarkMode: computed(() => true),
      toggleColorMode: mockToggleColorMode,
      darkLightMode: 'dark',
    })

    // Mount the component with icon variant
    const wrapper = mount(ScalarColorModeToggle, {
      props: { variant: 'icon' },
    })

    // Find and click the icon component
    await wrapper.get('button').trigger('click')

    // Verify the toggle function was called
    expect(mockToggleColorMode).toHaveBeenCalledTimes(1)
  })

  it('reflects dark mode state changes in the switch variant', async () => {
    const mode = ref('light')
    // Mock dark mode being enabled
    mockUseColorMode.mockImplementation(() => ({
      isDarkMode: computed(() => mode.value === 'dark'),
      darkLightMode: computed(() => mode.value),
    }))

    // Test switch variant
    const switchWrapper = mount(ScalarColorModeToggle)
    const switchButton = switchWrapper.get('button')
    expect(switchButton.attributes('aria-pressed')).toBe('false')
    expect(switchButton.attributes('aria-label')).toContain('Set dark mode')

    // Set dark mode
    mode.value = 'dark'
    await nextTick()

    // Check that the switch button is now in dark mode
    expect(switchButton.attributes('aria-pressed')).toBe('true')
    expect(switchButton.attributes('aria-label')).toContain('Set light mode')
  })

  it('reflects dark mode state changes in the icon variant', async () => {
    const mode = ref('light')
    mockUseColorMode.mockImplementation(() => ({
      isDarkMode: computed(() => mode.value === 'dark'),
      darkLightMode: computed(() => mode.value),
    }))

    // Test icon variant
    const iconWrapper = mount(ScalarColorModeToggle, {
      props: { variant: 'icon' },
    })
    const iconButton = iconWrapper.get('button')
    expect(iconButton.attributes('aria-label')).toContain('Set dark mode')
    expect(iconButton.attributes('class')).toContain('toggle-icon-light')

    // Set dark mode
    mode.value = 'dark'
    await nextTick()

    // Check that the icon button is now in dark mode
    expect(iconButton.attributes('class')).toContain('toggle-icon-dark')
    expect(iconButton.attributes('aria-label')).toContain('Set light mode')
  })
})
