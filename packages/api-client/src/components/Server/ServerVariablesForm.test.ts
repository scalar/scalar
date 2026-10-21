import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ServerVariablesForm from './ServerVariablesForm.vue'

describe('ServerVariablesForm', () => {
  it('associates hints with text and enum controls while preserving edits', async () => {
    const wrapper = mount(ServerVariablesForm, {
      props: { variables: { tenant: { default: 'demo' }, region: { default: 'eu', enum: ['eu', 'us'] } } },
      slots: { 'hint-tenant': '<span>Example tenant</span>', 'hint-region': '<span>Example region</span>' },
    })
    const input = wrapper.get('input')
    const button = wrapper.get('button')
    expect(wrapper.get(`[id="${input.attributes('aria-describedby')}"]`).text()).toBe('Example tenant')
    expect(wrapper.get(`[id="${button.attributes('aria-describedby')}"]`).text()).toBe('Example region')
    expect(input.element.value).toBe('demo')
    await input.setValue('custom')
    expect(wrapper.emitted('update:variable')).toStrictEqual([['tenant', 'custom']])
  })

  it('keeps forms without hints editable and respects supplied values', async () => {
    const wrapper = mount(ServerVariablesForm, {
      props: { variables: { tenant: { default: 'demo' } }, values: { tenant: 'current' }, layout: 'reference' },
    })
    expect(wrapper.get('input').element.value).toBe('current')
    expect(wrapper.get('input').attributes('aria-describedby')).toBeUndefined()
    await wrapper.get('input').setValue('next')
    expect(wrapper.emitted('update:variable')).toStrictEqual([['tenant', 'next']])
  })
})
