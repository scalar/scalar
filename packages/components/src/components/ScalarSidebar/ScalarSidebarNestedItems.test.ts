import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'

import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarItem from './ScalarSidebarItem.vue'
import ScalarSidebarItems from './ScalarSidebarItems.vue'
import ScalarSidebarNestedItems from './ScalarSidebarNestedItems.vue'

describe('ScalarSidebarNestedItems', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('renders with default slot content', () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarItems, ScalarSidebarNestedItems },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems>
            Nested Item Label
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toContain('Nested Item Label')
  })

  it('renders items slot when open', async () => {
    const TestComponent = defineComponent({
      components: {
        ScalarSidebarItems,
        ScalarSidebarNestedItems,
        ScalarSidebarItem,
      },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems v-model="open">
            Nested Item
            <template #items>
              <ScalarSidebarItem>Item 1</ScalarSidebarItem>
              <ScalarSidebarItem>Item 2</ScalarSidebarItem>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
      setup() {
        const open = ref(false)
        return { open }
      },
    })

    const wrapper = mount(TestComponent)
    const nestedComponent = wrapper.findComponent(ScalarSidebarNestedItems)

    // Items should not be visible initially
    expect(wrapper.text()).not.toContain('Item 1')
    expect(wrapper.text()).not.toContain('Item 2')

    // Open the nested items
    const button = nestedComponent.findComponent(ScalarSidebarButton)
    await button.trigger('click')

    // Items should now be visible
    expect(wrapper.text()).toContain('Item 1')
    expect(wrapper.text()).toContain('Item 2')
  })

  it('emits click event when button is clicked', async () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarItems, ScalarSidebarNestedItems },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems @click="handleClick">
            Nested Item
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
      setup() {
        // Handler for click event - no action needed in test
        const handleClick = () => {
          // Intentionally empty - just testing event emission
        }
        return { handleClick }
      },
    })

    const wrapper = mount(TestComponent)
    const nestedComponent = wrapper.findComponent(ScalarSidebarNestedItems)
    const button = nestedComponent.findComponent(ScalarSidebarButton)

    await button.trigger('click')

    expect(nestedComponent.emitted('click')).toBeTruthy()
    expect(nestedComponent.emitted('click')).toHaveLength(1)
  })

  it('opens when button is clicked in uncontrolled mode', async () => {
    const TestComponent = defineComponent({
      components: {
        ScalarSidebarItems,
        ScalarSidebarNestedItems,
        ScalarSidebarItem,
      },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems>
            Nested Item
            <template #items>
              <ScalarSidebarItem>Item 1</ScalarSidebarItem>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)
    const nestedComponent = wrapper.findComponent(ScalarSidebarNestedItems)
    const button = nestedComponent.findComponent(ScalarSidebarButton)

    // Should be closed initially
    expect(button.attributes('aria-expanded')).toBe('false')

    // Click to open
    await button.trigger('click')

    // Should now be open
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Item 1')
  })

  it('does not toggle when button is clicked in controlled mode', async () => {
    const TestComponent = defineComponent({
      components: {
        ScalarSidebarItems,
        ScalarSidebarNestedItems,
        ScalarSidebarItem,
      },
      props: { open: { type: Boolean, default: false } },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems controlled :open="open">
            Nested Item
            <template #items>
              <ScalarSidebarItem>Item 1</ScalarSidebarItem>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent, {
      props: { open: false },
    })
    const nestedComponent = wrapper.findComponent(ScalarSidebarNestedItems)
    const button = nestedComponent.findComponent(ScalarSidebarButton)

    // Should be closed initially
    expect(button.attributes('aria-expanded')).toBe('false')

    // Click should not toggle (controlled mode)
    await button.trigger('click')

    // Should still be closed
    expect(button.attributes('aria-expanded')).toBe('false')

    // Update prop to open
    await wrapper.setProps({ open: true })

    // Should now be open
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Item 1')
  })

  it('renders default back button with default label', async () => {
    const open = ref(true)

    const TestComponent = defineComponent({
      components: {
        ScalarSidebarItems,
        ScalarSidebarNestedItems,
        ScalarSidebarItem,
      },
      setup() {
        return { open }
      },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems :open>
            Nested Item
            <template #items>
              <ScalarSidebarItem>Item 1</ScalarSidebarItem>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)

    await nextTick()

    // Back button should be rendered with default "Back" label
    expect(wrapper.text()).toContain('Back')

    // Find the back button
    const backButtons = wrapper.findAll('button')
    const backButton = backButtons.find((btn) => btn.text().includes('Back'))
    expect(backButton).toBeDefined()
  })

  it('renders custom back button label slot', async () => {
    const open = ref(true)

    const TestComponent = defineComponent({
      components: {
        ScalarSidebarItems,
        ScalarSidebarNestedItems,
        ScalarSidebarItem,
      },
      setup() {
        return { open }
      },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems :open>
            Nested Item
            <template #back-label>
              Custom Back Label
            </template>
            <template #items>
              <ScalarSidebarItem>Item 1</ScalarSidebarItem>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)
    await nextTick()

    // Custom back label should be rendered
    expect(wrapper.text()).toContain('Custom Back Label')
    // Verify the default "Back" label is not used (check for standalone "Back" button text)
    const backButtons = wrapper.findAll('button')
    const defaultBackButton = backButtons.find((btn) => btn.text() === 'Back')
    expect(defaultBackButton).toBeUndefined()
  })

  it('renders custom back button slot', async () => {
    const open = ref(true)

    const TestComponent = defineComponent({
      components: {
        ScalarSidebarItems,
        ScalarSidebarNestedItems,
        ScalarSidebarItem,
      },
      setup() {
        return { open }
      },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems :open>
            Nested Item
            <template #back>
              <button class="custom-back-button">Custom Back</button>
            </template>
            <template #items>
              <ScalarSidebarItem>Item 1</ScalarSidebarItem>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)
    await nextTick()

    // Custom back button should be rendered
    const customBackButton = wrapper.find('.custom-back-button')
    expect(customBackButton.exists()).toBe(true)
    expect(customBackButton.text()).toBe('Custom Back')
  })

  it('emits back event when back button is clicked', async () => {
    const TestComponent = defineComponent({
      components: {
        ScalarSidebarItems,
        ScalarSidebarNestedItems,
        ScalarSidebarItem,
      },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems @back="handleBack">
            Nested Item
            <template #items>
              <ScalarSidebarItem>Item 1</ScalarSidebarItem>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
      setup() {
        // Handler for back event - no action needed in test
        const handleBack = () => {
          // Intentionally empty - just testing event emission
        }
        return { handleBack }
      },
    })

    const wrapper = mount(TestComponent)
    const nestedComponent = wrapper.findComponent(ScalarSidebarNestedItems)
    const button = nestedComponent.findComponent(ScalarSidebarButton)

    // Open the nested items by clicking the button
    await button.trigger('click')
    await nextTick()
    // Wait for transition (300ms duration)
    await vi.advanceTimersByTimeAsync(350)

    // Find and click the back button
    const backButtons = wrapper.findAll('button')
    const backButton = backButtons.find((btn) => btn.text().includes('Back'))
    expect(backButton).toBeDefined()

    await backButton?.trigger('click')

    expect(nestedComponent.emitted('back')).toBeTruthy()
    expect(nestedComponent.emitted('back')).toHaveLength(1)
  })

  it('closes when back button is clicked in uncontrolled mode', async () => {
    const TestComponent = defineComponent({
      components: {
        ScalarSidebarItems,
        ScalarSidebarNestedItems,
        ScalarSidebarItem,
      },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems>
            Nested Item
            <template #items>
              <ScalarSidebarItem>Item 1</ScalarSidebarItem>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)
    const nestedComponent = wrapper.findComponent(ScalarSidebarNestedItems)
    const button = nestedComponent.findComponent(ScalarSidebarButton)

    // Open the nested items by clicking the button
    await button.trigger('click')
    await nextTick()
    // Wait for transition (300ms duration)
    await vi.advanceTimersByTimeAsync(350)

    // Should be open now
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Item 1')

    // Find and click the back button
    const backButtons = wrapper.findAll('button')
    const backButton = backButtons.find((btn) => btn.text().includes('Back'))
    await backButton?.trigger('click')
    await nextTick()
    // Wait for transition after closing
    await vi.advanceTimersByTimeAsync(350)

    // Should now be closed
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(wrapper.text()).not.toContain('Item 1')
  })

  it('does not toggle when back button is clicked in controlled mode', async () => {
    const TestComponent = defineComponent({
      components: {
        ScalarSidebarItems,
        ScalarSidebarNestedItems,
        ScalarSidebarItem,
      },
      props: { open: { type: Boolean, default: true } },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems controlled :open="open">
            Nested Item
            <template #items>
              <ScalarSidebarItem>Item 1</ScalarSidebarItem>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent, {
      props: { open: true },
    })
    const nestedComponent = wrapper.findComponent(ScalarSidebarNestedItems)
    const button = nestedComponent.findComponent(ScalarSidebarButton)

    // Should be open initially
    expect(button.attributes('aria-expanded')).toBe('true')

    // Find and click the back button
    const backButtons = wrapper.findAll('button')
    const backButton = backButtons.find((btn) => btn.text().includes('Back'))
    await backButton?.trigger('click')

    // Should still be open (controlled mode)
    expect(button.attributes('aria-expanded')).toBe('true')

    // Update prop to close
    await wrapper.setProps({ open: false })

    // Should now be closed
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('renders custom button slot', () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarItems, ScalarSidebarNestedItems },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems>
            <template #button>
              <button class="custom-button">Custom Button</button>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)

    // Custom button should be rendered
    const customButton = wrapper.find('.custom-button')
    expect(customButton.exists()).toBe(true)
    expect(customButton.text()).toBe('Custom Button')

    // Default button should not be rendered
    const defaultButton = wrapper.findComponent(ScalarSidebarButton)
    expect(defaultButton.exists()).toBe(false)
  })

  it('renders custom icon slot', () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarItems, ScalarSidebarNestedItems },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems>
            Nested Item
            <template #icon>
              <span class="custom-icon">Icon</span>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)

    // Custom icon should be rendered
    expect(wrapper.find('.custom-icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('Icon')
  })

  it('renders custom aside slot', () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarItems, ScalarSidebarNestedItems },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems>
            Nested Item
            <template #aside>
              <span class="custom-aside">Custom Aside</span>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)

    // Custom aside should be rendered
    expect(wrapper.find('.custom-aside').exists()).toBe(true)
    expect(wrapper.text()).toContain('Custom Aside')
  })

  it('renders default aside icon when aside slot is not provided', () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarItems, ScalarSidebarNestedItems },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarNestedItems>
            Nested Item
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)
    const nestedComponent = wrapper.findComponent(ScalarSidebarNestedItems)
    const button = nestedComponent.findComponent(ScalarSidebarButton)

    // Default aside icon (ScalarIconArrowRight) should be rendered
    // Check that the button exists and has aside content
    expect(button.exists()).toBe(true)
    // The aside slot should contain the default arrow icon
    // We verify by checking the button HTML contains SVG (from ScalarIconArrowRight)
    const buttonHtml = button.html()
    expect(buttonHtml).toBeTruthy()
    // The default icon should be present (ScalarIconArrowRight renders as SVG)
    expect(buttonHtml).toContain('svg')
  })

  it('renders with correct indent level', () => {
    const TestComponent = defineComponent({
      components: {
        ScalarSidebarItems,
        ScalarSidebarNestedItems,
        ScalarSidebarItem,
      },
      template: `
        <ScalarSidebarItems>
          <ScalarSidebarItem>Level 0 Item</ScalarSidebarItem>
          <ScalarSidebarNestedItems>
            Level 0 Nested
            <template #items>
              <ScalarSidebarItem>Level 1 Item</ScalarSidebarItem>
            </template>
          </ScalarSidebarNestedItems>
        </ScalarSidebarItems>
      `,
    })

    const wrapper = mount(TestComponent)
    const nestedComponent = wrapper.findComponent(ScalarSidebarNestedItems)
    const button = nestedComponent.findComponent(ScalarSidebarButton)

    // The nested items button should have indent level 0 (reset: true)
    expect(button.props('indent')).toBe(0)
  })
})
