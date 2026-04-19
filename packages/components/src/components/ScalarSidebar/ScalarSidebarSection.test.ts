import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarGroupToggle from './ScalarSidebarGroupToggle.vue'
import ScalarSidebarItem from './ScalarSidebarItem.vue'
import ScalarSidebarSection from './ScalarSidebarSection.vue'

describe('ScalarSidebarSection', () => {
  it('renders a non-collapsible header by default', () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarSection, ScalarSidebarItem },
      template: `
        <ScalarSidebarSection>
          My Section
          <template #items>
            <ScalarSidebarItem>Items</ScalarSidebarItem>
          </template>
        </ScalarSidebarSection>
      `,
    })

    const wrapper = mount(TestComponent)

    const header = wrapper.findComponent(ScalarSidebarButton)
    expect(header.props('is')).toBe('div')
    expect(header.props('disabled')).toBe(true)

    // No toggle is rendered in the default mode
    expect(wrapper.findComponent(ScalarSidebarGroupToggle).exists()).toBe(false)

    // Items remain visible
    expect(wrapper.findComponent(ScalarSidebarItem).exists()).toBe(true)
  })

  it('renders a collapsible header with a toggle when enabled', () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarSection, ScalarSidebarItem },
      template: `
        <ScalarSidebarSection collapsible>
          Collapsible Section
          <template #items>
            <ScalarSidebarItem>Items</ScalarSidebarItem>
          </template>
        </ScalarSidebarSection>
      `,
    })

    const wrapper = mount(TestComponent)

    const header = wrapper.findComponent(ScalarSidebarButton)
    expect(header.props('is')).toBe('button')
    expect(header.props('disabled')).toBe(false)
    expect(header.attributes('aria-expanded')).toBe('true')

    expect(wrapper.findComponent(ScalarSidebarGroupToggle).exists()).toBe(true)
  })

  it('toggles open state and emits a toggle event on header click', async () => {
    const open = ref(true)
    const toggleSpy = vi.fn()

    const TestComponent = defineComponent({
      components: { ScalarSidebarSection, ScalarSidebarItem },
      setup() {
        return { open, toggleSpy }
      },
      template: `
        <ScalarSidebarSection
          v-model:open="open"
          collapsible
          @toggle="toggleSpy">
          Section
          <template #items>
            <ScalarSidebarItem>Items</ScalarSidebarItem>
          </template>
        </ScalarSidebarSection>
      `,
    })

    const wrapper = mount(TestComponent)

    const header = wrapper.findComponent(ScalarSidebarButton)
    await header.trigger('click')

    expect(open.value).toBe(false)
    expect(toggleSpy).toHaveBeenCalledTimes(1)
    expect(header.attributes('aria-expanded')).toBe('false')
  })

  it('hides items when collapsed', async () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarSection, ScalarSidebarItem },
      data() {
        return { open: true }
      },
      template: `
        <ScalarSidebarSection
          v-model:open="open"
          collapsible>
          Section
          <template #items>
            <ScalarSidebarItem>Items</ScalarSidebarItem>
          </template>
        </ScalarSidebarSection>
      `,
    })

    const wrapper = mount(TestComponent)

    // When open, the items list is not hidden via inline display style
    const openList = wrapper.get('ul').element as HTMLElement
    expect(openList.style.display).not.toBe('none')

    await wrapper.setData({ open: false })

    // v-show sets `display: none` inline when collapsed
    const closedList = wrapper.get('ul').element as HTMLElement
    expect(closedList.style.display).toBe('none')
  })
})
