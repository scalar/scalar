import { mount } from '@vue/test-utils'
import { DropdownMenu } from 'radix-vue/namespaced'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { ScalarMenu, ScalarMenuLink } from './'

const menuWithLink = (attrs: Record<string, unknown> = {}, slotText = 'My Link') =>
  defineComponent({
    components: { ScalarMenu, ScalarMenuLink },
    setup() {
      return { attrs, slotText }
    },
    template: `
<ScalarMenu>
  <template #sections>
    <ScalarMenuLink data-testid="menu-link" v-bind="attrs">{{ slotText }}</ScalarMenuLink>
  </template>
</ScalarMenu>`,
  })

describe('ScalarMenuLink', () => {
  it('renders an anchor tag by default', async () => {
    const wrapper = mount(menuWithLink(), { attachTo: document.body })

    await wrapper.find('button[aria-expanded=false]').trigger('click')

    const link = wrapper.get('[data-testid="menu-link"]')
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('role')).toBe('menuitem')

    const items = wrapper.findAllComponents(DropdownMenu.Item)
    expect(items.some((c) => c.find('[data-testid="menu-link"]').exists())).toBe(true)

    wrapper.unmount()
  })

  it('renders DropdownMenu.Item while changing the DOM tag with is', async () => {
    const wrapper = mount(menuWithLink({ is: 'button' }), {
      attachTo: document.body,
    })

    await wrapper.find('button[aria-expanded=false]').trigger('click')

    const link = wrapper.get('[data-testid="menu-link"]')
    expect(link.element.tagName).toBe('BUTTON')
    expect(link.attributes('role')).toBe('menuitem')

    const items = wrapper.findAllComponents(DropdownMenu.Item)
    expect(items.some((c) => c.find('[data-testid="menu-link"]').exists())).toBe(true)

    wrapper.unmount()
  })
})
