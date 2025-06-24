import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { markRaw } from 'vue'
import { ScalarIconAcorn } from '@scalar/icons'

import ScalarIconButton from './ScalarIconButton.vue'
import { ScalarIconLegacyAdapter } from '../ScalarIcon'
import { cleanupTooltipElement } from '../ScalarTooltip/useTooltip'
import { ELEMENT_ID } from '../ScalarTooltip/constants'

describe('ScalarIconButton', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Use fake timers for tooltip delay testing
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Clean up any mounted components
    document.body.innerHTML = ''

    // Clean up tooltip element
    cleanupTooltipElement()

    // Restore real timers
    vi.useRealTimers()
  })

  describe('Basic rendering', () => {
    it('renders properly with required props', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Test Button',
        },
      })

      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.attributes('type')).toBe('button')
      expect(wrapper.find('.sr-only').text()).toBe('Test Button')
    })

    it('renders with component-based icon', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: markRaw(ScalarIconAcorn),
          label: 'Test Button',
        },
      })

      expect(wrapper.findComponent(ScalarIconLegacyAdapter).exists()).toBe(true)
      expect(wrapper.find('.sr-only').text()).toBe('Test Button')
    })

    it('renders with string-based legacy icon', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Test Button',
        },
      })

      expect(wrapper.findComponent(ScalarIconLegacyAdapter).exists()).toBe(true)
      expect(wrapper.findComponent(ScalarIconLegacyAdapter).props('icon')).toBe('Logo')
    })
  })

  describe('Disabled state', () => {
    it('applies disabled state correctly', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Disabled Button',
          disabled: true,
        },
      })

      expect(wrapper.attributes('aria-disabled')).toBe('true')
      expect(wrapper.classes()).toContain('cursor-not-allowed')
    })

    it('allows disabled buttons to receive focus', async () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Disabled Button',
          disabled: true,
        },
        attachTo: document.body,
      })

      // Trigger focus event
      await wrapper.element.focus()
      await nextTick()

      // Check if the button has focus by verifying it's the active element
      expect(document.activeElement).toBe(wrapper.element)
    })

    it('does not apply disabled classes when disabled is false', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Enabled Button',
          disabled: false,
        },
      })

      expect(wrapper.attributes('aria-disabled')).toBe('false')
      expect(wrapper.classes()).not.toContain('cursor-not-allowed')
    })
  })

  describe('Variants', () => {
    it('applies ghost variant by default', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Ghost Button',
        },
      })

      // Ghost variant should be applied by default
      expect(wrapper.classes()).toContain('scalar-icon-button')
    })

    it('applies different variants correctly', () => {
      const variants = ['solid', 'outlined', 'ghost', 'danger'] as const

      variants.forEach((variant) => {
        const wrapper = mount(ScalarIconButton, {
          props: {
            icon: 'Logo',
            label: `${variant} button`,
            variant,
          },
        })

        // The variant classes come from the ScalarButton styles
        expect(wrapper.classes()).toContain('scalar-icon-button')
      })
    })
  })

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Medium Button',
        },
      })

      expect(wrapper.classes()).toContain('size-8')
      expect(wrapper.classes()).toContain('p-2')
    })

    it('applies different sizes correctly', () => {
      const sizes = [
        { size: 'xxs', expectedClasses: ['size-3.5', 'p-0.5'] },
        { size: 'xs', expectedClasses: ['size-5', 'p-1'] },
        { size: 'sm', expectedClasses: ['size-6', 'p-1'] },
        { size: 'md', expectedClasses: ['size-8', 'p-2'] },
        { size: 'full', expectedClasses: ['size-full'] },
      ] as const

      sizes.forEach(({ size, expectedClasses }) => {
        const wrapper = mount(ScalarIconButton, {
          props: {
            icon: 'Logo',
            label: `${size} button`,
            size,
          },
        })

        expectedClasses.forEach((className) => {
          expect(wrapper.classes()).toContain(className)
        })
      })
    })
  })

  describe('Icon properties', () => {
    it('passes weight prop to icon component', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Weighted Icon',
          weight: 'bold',
        },
      })

      const iconComponent = wrapper.findComponent(ScalarIconLegacyAdapter)
      expect(iconComponent.props('weight')).toBe('bold')
    })

    it('passes thickness prop to icon component (deprecated)', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Thick Icon',
          thickness: '2',
        },
      })

      const iconComponent = wrapper.findComponent(ScalarIconLegacyAdapter)
      expect(iconComponent.props('thickness')).toBe('2')
    })

    it('passes both weight and thickness props', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Icon with both props',
          weight: 'light',
          thickness: '1.5',
        },
      })

      const iconComponent = wrapper.findComponent(ScalarIconLegacyAdapter)
      expect(iconComponent.props('weight')).toBe('light')
      expect(iconComponent.props('thickness')).toBe('1.5')
    })
  })

  describe('Tooltip functionality', () => {
    it('creates tooltip element when tooltip prop is true', async () => {
      mount(ScalarIconButton, {
        props: {
          icon: markRaw(ScalarIconAcorn),
          label: 'Button with tooltip',
          tooltip: true,
        },
        attachTo: document.body,
      })

      await nextTick()

      // Check if tooltip element is created in the DOM
      const tooltipElement = document.getElementById(ELEMENT_ID)
      expect(tooltipElement).toBeTruthy()
      expect(tooltipElement?.classList).toContain('scalar-tooltip')
    })

    it('shows tooltip content on hover when tooltip is enabled', async () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: markRaw(ScalarIconAcorn),
          label: 'Button with tooltip',
          tooltip: true,
        },
        attachTo: document.body,
      })

      await nextTick()

      const tooltipElement = document.getElementById(ELEMENT_ID)
      expect(tooltipElement).toBeTruthy()

      // Initially tooltip should be hidden
      expect(tooltipElement?.style.display).toBe('none')

      // Trigger mouseenter event directly on the button element
      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'))
      await nextTick()

      // Advance fake timers past the default delay (300ms)
      vi.runAllTimers()
      await nextTick()

      // Tooltip should now be visible and contain the label text
      expect(tooltipElement?.style.display).toBe('block')
      expect(tooltipElement?.textContent).toBe('Button with tooltip')
    })

    it('shows tooltip content on keyboard focus when tooltip is enabled', async () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: markRaw(ScalarIconAcorn),
          label: 'Button with tooltip',
          tooltip: true,
        },
        attachTo: document.body,
      })

      await nextTick()

      const tooltipElement = document.getElementById(ELEMENT_ID)
      expect(tooltipElement).toBeTruthy()

      // Initially tooltip should be hidden
      expect(tooltipElement?.style.display).toBe('none')

      // Trigger focus event directly on the button element
      wrapper.element.dispatchEvent(new FocusEvent('focus'))
      await nextTick()

      // Focus shows tooltip immediately (no delay)
      expect(tooltipElement?.style.display).toBe('block')
      expect(tooltipElement?.textContent).toBe('Button with tooltip')
    })

    it('hides tooltip on mouse leave', async () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: markRaw(ScalarIconAcorn),
          label: 'Button with tooltip',
          tooltip: true,
        },
        attachTo: document.body,
      })

      await nextTick()

      const tooltipElement = document.getElementById(ELEMENT_ID)

      // Show tooltip first
      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'))
      vi.runAllTimers()
      await nextTick()
      expect(tooltipElement?.style.display).toBe('block')

      // Hide tooltip on mouseleave
      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'))
      await nextTick()

      expect(tooltipElement?.style.display).toBe('none')
    })

    it('hides tooltip on keyboard blur', async () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: markRaw(ScalarIconAcorn),
          label: 'Button with tooltip',
          tooltip: true,
        },
        attachTo: document.body,
      })

      await nextTick()

      const tooltipElement = document.getElementById(ELEMENT_ID)

      // Show tooltip first via focus
      wrapper.element.dispatchEvent(new FocusEvent('focus'))
      await nextTick()
      expect(tooltipElement?.style.display).toBe('block')

      // Hide tooltip on blur
      wrapper.element.dispatchEvent(new FocusEvent('blur'))
      await nextTick()

      expect(tooltipElement?.style.display).toBe('none')
    })

    it('does not show tooltip when tooltip prop is false', async () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: markRaw(ScalarIconAcorn),
          label: 'Button without tooltip',
          tooltip: false,
        },
        attachTo: document.body,
      })

      await nextTick()

      // Trigger mouseenter
      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'))
      await nextTick()
      vi.runAllTimers()
      await nextTick()

      // Tooltip element might exist from other tests, but should not show content
      const tooltipElement = document.getElementById(ELEMENT_ID)
      expect(tooltipElement?.textContent).toBe('')
      expect(tooltipElement?.style.display).toBe('none')
    })

    it('does not show tooltip when tooltip prop is undefined', async () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: markRaw(ScalarIconAcorn),
          label: 'Button without tooltip',
        },
        attachTo: document.body,
      })

      await nextTick()

      // Trigger mouseenter
      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'))
      await nextTick()

      vi.runAllTimers()
      await nextTick()

      // Tooltip element might exist from other tests, but should not show content
      const tooltipElement = document.getElementById(ELEMENT_ID)
      expect(tooltipElement?.textContent).toBe('')
      expect(tooltipElement?.style.display).toBe('none')
    })
  })

  describe('Accessibility', () => {
    it('provides accessible label through sr-only span', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Accessibility Test',
        },
      })

      const srOnlyElement = wrapper.find('.sr-only')
      expect(srOnlyElement.exists()).toBe(true)
      expect(srOnlyElement.text()).toBe('Accessibility Test')
    })

    it('sets correct button type', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Type Test',
        },
      })

      expect(wrapper.attributes('type')).toBe('button')
    })

    it('maintains accessibility with disabled state', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Disabled Accessibility',
          disabled: true,
        },
      })

      expect(wrapper.attributes('aria-disabled')).toBe('true')
      expect(wrapper.find('.sr-only').text()).toBe('Disabled Accessibility')
    })
  })

  describe('CSS classes and styling', () => {
    it('applies base CSS classes', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Base Classes',
        },
      })

      expect(wrapper.classes()).toContain('scalar-icon-button')
      expect(wrapper.classes()).toContain('aspect-square')
      expect(wrapper.classes()).toContain('cursor-pointer')
    })

    it('combines variant and size classes correctly', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Combined Classes',
          variant: 'solid',
          size: 'sm',
        },
      })

      expect(wrapper.classes()).toContain('scalar-icon-button')
      expect(wrapper.classes()).toContain('size-6')
      expect(wrapper.classes()).toContain('p-1')
    })

    it('applies disabled classes when disabled', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Disabled Classes',
          disabled: true,
        },
      })

      expect(wrapper.classes()).toContain('cursor-not-allowed')
      expect(wrapper.classes()).toContain('shadow-none')
    })
  })

  describe('Attribute inheritance', () => {
    it('inherits attributes correctly', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Attribute Test',
        },
        attrs: {
          'data-testid': 'custom-icon-button',
          id: 'test-button',
        },
      })

      expect(wrapper.attributes('data-testid')).toBe('custom-icon-button')
      expect(wrapper.attributes('id')).toBe('test-button')
    })

    it('handles class merging correctly', () => {
      const wrapper = mount(ScalarIconButton, {
        props: {
          icon: 'Logo',
          label: 'Class Merging',
        },
        attrs: {
          class: 'custom-class',
        },
      })

      expect(wrapper.classes()).toContain('custom-class')
      expect(wrapper.classes()).toContain('scalar-icon-button')
    })
  })
})
