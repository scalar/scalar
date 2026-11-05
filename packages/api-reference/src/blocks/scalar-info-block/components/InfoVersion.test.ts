import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import InfoVersion from './InfoVersion.vue'

describe('InfoVersion', () => {
  it.each([
    '35301c34ac182da93c963b4e494fa9f17198bbce',
    'abc123def456',
    '1.0.0',
    '0.1.0',
    'v1.0.0',
    'alpha',
    'beta-1.0',
    '~1.0.0',
    '1.0.0-beta.1',
    '1.0.0+build.123',
    '1.2.3.4',
    '2026-11-05',
    '0',
  ])('displays version %s verbatim', (version) => {
    const wrapper = mount(InfoVersion, { props: { version } })

    expect(wrapper.text()).toBe(version)
  })

  it('hides the badge when the version is empty', () => {
    const wrapper = mount(InfoVersion, { props: { version: '' } })

    expect(wrapper.findComponent({ name: 'Badge' }).exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })

  it('updates the displayed version when the document changes', async () => {
    const wrapper = mount(InfoVersion, { props: { version: '1.0.0' } })

    await wrapper.setProps({ version: '35301c34ac182da93c963b4e494fa9f17198bbce' })

    expect(wrapper.text()).toBe('35301c34ac182da93c963b4e494fa9f17198bbce')
  })
})
