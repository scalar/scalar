import { useModal } from '@scalar/components'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import OAuthScopesAddModal from './OAuthScopesAddModal.vue'

/**
 * Mock the toast composable to capture toast calls in tests.
 */
const mockToast = vi.fn()
vi.mock('@scalar/use-toasts', () => ({
  useToasts: () => ({
    toast: mockToast,
  }),
}))

describe('OAuthScopesAddModal', () => {
  const mountWithProps = (
    custom: Partial<{
      scopes: string[]
    }> = {},
  ) => {
    const state = useModal()
    const scopes = custom.scopes ?? []

    return mount(OAuthScopesAddModal, {
      props: {
        state,
        scopes,
      },
      attachTo: document.body,
    })
  }

  beforeEach(() => {
    mockToast.mockClear()
  })

  it('emits submit event with scope data when form is submitted with valid name', async () => {
    const wrapper = mountWithProps({ scopes: [] })
    const state = wrapper.props('state')
    state.show()
    await nextTick()

    // Find the name input component and set a value
    const nameInputs = wrapper.findAllComponents({ name: 'CommandActionInput' })
    expect(nameInputs.length).toBeGreaterThanOrEqual(2)

    // First input is the name field
    await nameInputs[0]!.vm.$emit('update:modelValue', 'read:user')
    await nextTick()

    // Second input is the description field
    await nameInputs[1]!.vm.$emit('update:modelValue', 'Read user data')
    await nextTick()

    // Find and trigger the submit event
    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    // Check that submit event was emitted with correct data
    const submitEvents = wrapper.emitted('submit')
    expect(submitEvents).toBeTruthy()
    expect(submitEvents).toHaveLength(1)
    expect(submitEvents?.[0]?.[0]).toEqual({
      name: 'read:user',
      description: 'Read user data',
    })

    // Check that modal was hidden
    expect(state.open).toBe(false)
  })

  it('shows error toast and does not emit submit when form is submitted without name', async () => {
    const wrapper = mountWithProps({ scopes: [] })
    const state = wrapper.props('state')
    state.show()
    await nextTick()

    // Only set description, leave name empty
    const nameInputs = wrapper.findAllComponents({ name: 'CommandActionInput' })
    expect(nameInputs.length).toBeGreaterThanOrEqual(2)

    // Set only the description (second input), leave name (first input) empty
    await nameInputs[1]!.vm.$emit('update:modelValue', 'Read user data')
    await nextTick()

    // Find and trigger the submit event
    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    // Check that toast was called with error message
    expect(mockToast).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith('Please fill in the name before adding a scope.', 'error')

    // Check that submit event was not emitted
    const submitEvents = wrapper.emitted('submit')
    expect(submitEvents).toBeUndefined()

    // Check that modal is still open
    expect(state.open).toBe(true)
  })

  it('disables form when scope name already exists in scopes array', async () => {
    const existingScopes = ['read:user', 'write:user']
    const wrapper = mountWithProps({ scopes: existingScopes })
    const state = wrapper.props('state')
    state.show()
    await nextTick()

    // Find the name input component and set it to an existing scope name
    const nameInputs = wrapper.findAllComponents({ name: 'CommandActionInput' })
    expect(nameInputs.length).toBeGreaterThanOrEqual(2)

    // Set the name to an existing scope
    await nameInputs[0]!.vm.$emit('update:modelValue', 'read:user')
    await nextTick()

    // Check that the form is disabled
    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })
})
