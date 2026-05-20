import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarComboboxOptionGroup from './ScalarComboboxOptionGroup.vue'

describe('ScalarComboboxOptionGroup', () => {
  it('renders group label when not hidden', () => {
    const wrapper = mount(ScalarComboboxOptionGroup, {
      props: {
        id: 'test-group',
      },
      slots: {
        label: 'Group Label',
        default: '<div>Group Content</div>',
      },
    })

    expect(wrapper.text()).toContain('Group Label')
    expect(wrapper.text()).toContain('Group Content')
  })

  it('hides group label when hidden prop is true', () => {
    const wrapper = mount(ScalarComboboxOptionGroup, {
      props: {
        id: 'test-group',
        hidden: true,
      },
      slots: {
        label: 'Group Label',
        default: '<div>Group Content</div>',
      },
    })

    expect(wrapper.text()).not.toContain('Group Label')
    expect(wrapper.text()).toContain('Group Content')
  })

  it('uses provided ID when given', () => {
    const wrapper = mount(ScalarComboboxOptionGroup, {
      props: { id: 'custom-group-id' },
      slots: { default: '<div>Content</div>' },
    })

    const id = wrapper.attributes('id')
    expect(id).toBe('custom-group-id')
  })

  it('handles custom slot content properly', () => {
    const wrapper = mount(ScalarComboboxOptionGroup, {
      props: { id: 'custom-group' },
      slots: {
        label: `
          <div data-test="custom-label">
            <span>📁</span>
            <span>Custom Group</span>
          </div>
        `,
        default: `
          <div data-test="custom-content">
            <button>Option 1</button>
            <button>Option 2</button>
          </div>
        `,
      },
    })

    expect(wrapper.find('[data-test="custom-label"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="custom-content"]').exists()).toBe(true)
    expect(wrapper.findAll('button')).toHaveLength(2)
  })
})
