import { useModal } from '@scalar/components'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import OAuthScopesAddModal from './OAuthScopesAddModal.vue'

describe('OAuthScopesAddModal', () => {
  /** Wrappers are unmounted in afterEach to avoid teleported DOM leaking between tests. */
  const wrappers: Array<ReturnType<typeof mount>> = []

  const mountWithProps = (
    custom: Partial<{
      scopes: string[]
      scope: { name: string; description: string } | null
    }> = {},
  ) => {
    const state = useModal()
    const scopes = custom.scopes ?? []
    const scope = custom.scope ?? null

    const wrapper = mount(OAuthScopesAddModal, {
      props: {
        state,
        scopes,
        scope,
      },
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    return wrapper
  }

  const openModal = async (wrapper: ReturnType<typeof mountWithProps>) => {
    const state = wrapper.props('state')
    state.show()
    await nextTick()
    return state
  }

  afterEach(() => {
    while (wrappers.length > 0) {
      wrappers.pop()?.unmount()
    }
  })

  it('emits submit with the scope data when the form is submitted with a valid name', async () => {
    const wrapper = mountWithProps({ scopes: [] })
    const state = await openModal(wrapper)

    const inputs = wrapper.findAllComponents({ name: 'CommandActionInput' })
    expect(inputs.length).toBeGreaterThanOrEqual(2)

    await inputs[0]!.vm.$emit('update:modelValue', 'read:user')
    await inputs[1]!.vm.$emit('update:modelValue', 'Read user data')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const submitEvents = wrapper.emitted('submit')
    expect(submitEvents).toBeTruthy()
    expect(submitEvents).toHaveLength(1)
    expect(submitEvents?.[0]?.[0]).toEqual({
      name: 'read:user',
      description: 'Read user data',
    })
    expect(state.open).toBe(false)
  })

  it('does not show the required-name error when reopening add mode after a previous submit', async () => {
    const wrapper = mountWithProps({ scopes: [] })
    let state = await openModal(wrapper)

    const inputs = wrapper.findAllComponents({ name: 'CommandActionInput' })
    await inputs[0]!.vm.$emit('update:modelValue', 'read:user')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(state.open).toBe(false)

    state = await openModal(wrapper)
    await nextTick()

    expect(queryAlert()).toBeNull()
    expect(state.open).toBe(true)
  })

  it('trims whitespace from the submitted name', async () => {
    const wrapper = mountWithProps({ scopes: [] })
    await openModal(wrapper)

    const inputs = wrapper.findAllComponents({ name: 'CommandActionInput' })
    await inputs[0]!.vm.$emit('update:modelValue', '  read:user  ')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      name: 'read:user',
    })
  })

  /** The modal is teleported by Headless UI's Dialog, so DOM queries must go through body. */
  const queryAlert = (): HTMLElement | null => document.body.querySelector('[role="alert"]')

  it('shows an inline error and does not emit submit when the form is submitted without a name', async () => {
    const wrapper = mountWithProps({ scopes: [] })
    const state = await openModal(wrapper)

    const inputs = wrapper.findAllComponents({ name: 'CommandActionInput' })
    // Set only the description so the name field stays empty
    await inputs[1]!.vm.$emit('update:modelValue', 'Read user data')
    // Touch the name field so the "required" error surfaces, then clear it
    await inputs[0]!.vm.$emit('update:modelValue', 'x')
    await inputs[0]!.vm.$emit('update:modelValue', '')
    await nextTick()

    const error = queryAlert()
    expect(error).not.toBeNull()
    expect(error?.textContent).toContain('Scope name is required.')

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(state.open).toBe(true)
  })

  it('shows a duplicate-name inline error when the scope name already exists', async () => {
    const wrapper = mountWithProps({ scopes: ['read:user', 'write:user'] })
    await openModal(wrapper)

    const inputs = wrapper.findAllComponents({ name: 'CommandActionInput' })
    await inputs[0]!.vm.$emit('update:modelValue', 'read:user')
    await nextTick()

    const error = queryAlert()
    expect(error).not.toBeNull()
    expect(error?.textContent).toContain('A scope named "read:user" already exists.')

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('does not show a duplicate error in edit mode when the original name is unchanged', async () => {
    const wrapper = mountWithProps({
      scopes: ['read:user'],
      scope: { name: 'read:user', description: 'Read user' },
    })
    await openModal(wrapper)

    // Initial render uses the existing name and should be free of errors
    expect(queryAlert()).toBeNull()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('emits submit with oldName in edit mode', async () => {
    const wrapper = mountWithProps({
      scopes: ['read:user'],
      scope: { name: 'read:user', description: 'Read user' },
    })
    await openModal(wrapper)

    const inputs = wrapper.findAllComponents({ name: 'CommandActionInput' })
    await inputs[0]!.vm.$emit('update:modelValue', 'read:stuff')
    await inputs[1]!.vm.$emit('update:modelValue', 'Read everything')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      name: 'read:stuff',
      description: 'Read everything',
      oldName: 'read:user',
    })
  })
})
