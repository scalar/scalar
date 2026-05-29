import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { ScalarMenu, ScalarMenuLink } from './'
import { openScalarMenuPanel } from './openScalarMenuPanel'

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
    try {
      const panel = await openScalarMenuPanel(wrapper)
      const link = panel.querySelector('[data-testid="menu-link"]')
      expect(link).not.toBeNull()
      expect(link!.tagName).toBe('A')
      expect(link!.getAttribute('role')).toBe('menuitem')
    } finally {
      wrapper.unmount()
    }
  })

  it('renders DropdownMenu.Item while changing the DOM tag with is', async () => {
    const wrapper = mount(menuWithLink({ is: 'button' }), {
      attachTo: document.body,
    })
    try {
      const panel = await openScalarMenuPanel(wrapper)
      const link = panel.querySelector('[data-testid="menu-link"]')
      expect(link).not.toBeNull()
      expect(link!.tagName).toBe('BUTTON')
      expect(link!.getAttribute('role')).toBe('menuitem')
    } finally {
      wrapper.unmount()
    }
  })
})
