import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { ScalarMenu, ScalarMenuLink } from './'

describe('ScalarMenu', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarMenu)
    expect(wrapper.find('input')).toBeDefined()
  })
})

describe('ScalarMenuLink', () => {
  const MockMenu = defineComponent({
    components: { ScalarMenu, ScalarMenuLink },
    template: `
<ScalarMenu>
  <template #sections>
    <ScalarMenuLink data-testid="menu-link">My Link</ScalarMenuLink>
  </template>
</ScalarMenu>`,
  })

  it('renders an anchor tag', async () => {
    const wrapper = mount(MockMenu, { attachTo: document.body })

    await wrapper.find('button[aria-expanded=false]').trigger('click')
    expect(wrapper.find('a[data-testid="menu-link"]').exists()).toBeTruthy()
  })
})
