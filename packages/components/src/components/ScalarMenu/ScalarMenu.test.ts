import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { ScalarMenu } from './'

/** Radix sets aria-expanded on the menu trigger */
const triggerSelector = 'button[aria-expanded]'

const trigger = (wrapper: ReturnType<typeof mount>) => wrapper.get(triggerSelector)

describe('ScalarMenu', () => {
  it('exposes Open Menu as the default trigger label while closed', () => {
    const wrapper = mount(ScalarMenu, { attachTo: document.body })
    try {
      expect(wrapper.text()).toMatch(/Open Menu/)
      expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
    } finally {
      wrapper.unmount()
    }
  })

  it('shows default product entries after the trigger opens the menu', async () => {
    const wrapper = mount(ScalarMenu, { attachTo: document.body })
    try {
      await trigger(wrapper).trigger('click')
      expect(wrapper.text()).toContain('Dashboard')
      expect(wrapper.text()).toContain('Client')
    } finally {
      wrapper.unmount()
    }
  })

  it('marks the trigger closed after the trigger toggles the menu again', async () => {
    const wrapper = mount(ScalarMenu, { attachTo: document.body })
    try {
      const t = trigger(wrapper)
      await t.trigger('click')
      expect(t.attributes('aria-expanded')).toBe('true')
      await t.trigger('click')
      expect(t.attributes('aria-expanded')).toBe('false')
    } finally {
      wrapper.unmount()
    }
  })

  it('closes when the products slot invokes close', async () => {
    const WithSlot = defineComponent({
      components: { ScalarMenu },
      template: `
<ScalarMenu>
  <template #products="{ close }">
    <button data-testid="products-close" type="button" @click="close">Close</button>
  </template>
</ScalarMenu>`,
    })
    const wrapper = mount(WithSlot, { attachTo: document.body })
    try {
      await trigger(wrapper).trigger('click')
      await wrapper.get('[data-testid="products-close"]').trigger('click')
      expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
    } finally {
      wrapper.unmount()
    }
  })

  it('renders profile slot content inside the open panel', async () => {
    const WithProfile = defineComponent({
      components: { ScalarMenu },
      template: `
<ScalarMenu>
  <template #profile>
    <p data-testid="profile-slot">Workspace</p>
  </template>
</ScalarMenu>`,
    })
    const wrapper = mount(WithProfile, { attachTo: document.body })
    try {
      await trigger(wrapper).trigger('click')
      expect(wrapper.get('[data-testid="profile-slot"]').text()).toContain('Workspace')
    } finally {
      wrapper.unmount()
    }
  })

  it('renders the logo slot inside the trigger', () => {
    const WithLogo = defineComponent({
      components: { ScalarMenu },
      template: `
<ScalarMenu>
  <template #logo>
    <span data-testid="custom-logo">CL</span>
  </template>
</ScalarMenu>`,
    })
    const wrapper = mount(WithLogo, { attachTo: document.body })
    try {
      expect(wrapper.get('[data-testid="custom-logo"]').text()).toBe('CL')
    } finally {
      wrapper.unmount()
    }
  })

  it('uses the label slot for the trigger screen reader text', () => {
    const WithLabel = defineComponent({
      components: { ScalarMenu },
      template: `
<ScalarMenu>
  <template #label>Custom menu label</template>
</ScalarMenu>`,
    })
    const wrapper = mount(WithLabel, { attachTo: document.body })
    try {
      expect(wrapper.text()).toMatch(/Custom menu label/)
    } finally {
      wrapper.unmount()
    }
  })

  it('replaces default sections when the sections slot is provided', async () => {
    const WithSections = defineComponent({
      components: { ScalarMenu },
      template: `
<ScalarMenu>
  <template #sections>
    <div data-testid="custom-sections">Only custom sections</div>
  </template>
</ScalarMenu>`,
    })
    const wrapper = mount(WithSections, { attachTo: document.body })
    try {
      await trigger(wrapper).trigger('click')
      expect(wrapper.get('[data-testid="custom-sections"]').text()).toContain('Only custom sections')
      expect(wrapper.text()).not.toContain('Terms & Conditions')
    } finally {
      wrapper.unmount()
    }
  })

  it('forwards fallthrough attributes to the menu surface', async () => {
    const wrapper = mount(ScalarMenu, {
      attachTo: document.body,
      attrs: { 'data-testid': 'menu-surface' },
    })
    try {
      await trigger(wrapper).trigger('click')
      expect(wrapper.find('[data-testid="menu-surface"]').exists()).toBe(true)
    } finally {
      wrapper.unmount()
    }
  })
})
