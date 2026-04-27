import { useModal } from '@scalar/components'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import CreateVersionModal from './CreateVersionModal.vue'

enableAutoUnmount(afterEach)

/**
 * `ScalarModal` teleports its body via Headless UI's `Dialog` and
 * `CommandActionInput` actually renders a `<textarea>`, so the input ends
 * up outside the Vue Test Utils wrapper subtree. These helpers query the
 * live document instead so we can drive the modal end-to-end.
 */
const queryInput = (): HTMLTextAreaElement => {
  const input = document.querySelector<HTMLTextAreaElement>('textarea')
  if (!input) {
    throw new Error('Expected the modal input to be rendered.')
  }
  return input
}

const queryForm = (): HTMLFormElement => {
  const form = document.querySelector<HTMLFormElement>('form')
  if (!form) {
    throw new Error('Expected the modal form to be rendered.')
  }
  return form
}

const setInputValue = async (value: string): Promise<void> => {
  const input = queryInput()
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

const submitForm = async (): Promise<void> => {
  queryForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
}

const mountModal = (props: { existingVersions?: string[] } = {}) => {
  const state = useModal()
  state.show()
  const wrapper = mount(CreateVersionModal, {
    props: {
      state,
      existingVersions: props.existingVersions ?? [],
    },
    attachTo: document.body,
  })
  return { wrapper, state }
}

describe('CreateVersionModal', () => {
  it('emits `create` with the trimmed version when the user submits a non-empty value', async () => {
    const { wrapper } = mountModal()
    await flushPromises()

    await setInputValue('  2.1.0  ')
    await submitForm()

    expect(wrapper.emitted('create')).toEqual([['2.1.0']])
  })

  it('hides the modal after a successful submit so it does not stay open', async () => {
    const { state } = mountModal()
    await flushPromises()

    await setInputValue('2.1.0')
    await submitForm()

    expect(state.open).toBe(false)
  })

  it('blocks submission while the input is empty or whitespace-only', async () => {
    const { wrapper } = mountModal()
    await flushPromises()

    await submitForm()
    expect(wrapper.emitted('create')).toBeUndefined()

    await setInputValue('   ')
    await submitForm()
    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('rejects versions that already exist locally and surfaces an error message', async () => {
    const { wrapper } = mountModal({ existingVersions: ['1.0.0', '2.0.0'] })
    await flushPromises()

    await setInputValue('2.0.0')

    expect(document.body.textContent).toContain('already loaded in the workspace')

    await submitForm()
    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('allows submitting a version that exists only on the registry (not locally)', async () => {
    // Versions advertised by the registry but not yet loaded into the
    // workspace are intentionally absent from `existingVersions`. Submitting
    // one of them is the conflict-resolution path the create-draft flow
    // wants to allow.
    const { wrapper } = mountModal({ existingVersions: [] })
    await flushPromises()

    await setInputValue('2.0.0')
    await submitForm()

    expect(wrapper.emitted('create')).toEqual([['2.0.0']])
  })

  it('resets the input when the modal reopens so stale text does not leak across sessions', async () => {
    const { state } = mountModal()
    await flushPromises()

    await setInputValue('2.1.0')
    state.hide()
    await flushPromises()

    state.show()
    await flushPromises()

    expect(queryInput().value).toBe('')
  })
})
