import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

enableAutoUnmount(afterEach)

const environment: XScalarEnvironment = { color: '#ff0000', variables: [] }

describe('RequestAuthDataTableInput', () => {
  const findReset = (wrapper: ReturnType<typeof mount>) =>
    wrapper
      .findAllComponents({ name: 'ScalarIconButton' })
      .find((button) => button.props('label') === 'Reset to default')

  it('offers reset only when the caller allows it', async () => {
    const wrapper = mount(RequestAuthDataTableInput, {
      props: { environment, modelValue: 'typed', canReset: false },
      slots: { default: 'Bearer Token' },
    })

    expect(findReset(wrapper)).toBeUndefined()

    await wrapper.setProps({ canReset: true })
    expect(findReset(wrapper)).toBeDefined()
  })

  it('moves focus to the field before reset disappears', async () => {
    const wrapper = mount(RequestAuthDataTableInput, {
      attachTo: document.body,
      props: { environment, modelValue: 'typed', canReset: true, type: 'password' },
      slots: { default: 'Bearer Token' },
    })

    await findReset(wrapper)?.trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)

    // The parent restores the default, so reset hides itself while it still had focus
    await wrapper.setProps({ modelValue: 'configured', canReset: false })

    expect(findReset(wrapper)).toBeUndefined()
    expect(document.activeElement).toBe(wrapper.get('input').element)
  })
})
