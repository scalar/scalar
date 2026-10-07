import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

import GenerateSdkButton from './GenerateSdkButton.vue'
import { GENERATE_SDK_CONTEXT_SYMBOL, type GenerateSdkContext, type GenerateSdkResult } from './use-generate-sdk'

const toast = vi.hoisted(() => vi.fn())
vi.mock('@scalar/use-toasts', () => ({ useToasts: () => ({ toast }) }))

const createContext = (
  overrides: Partial<GenerateSdkContext> & { result?: GenerateSdkResult } = {},
): GenerateSdkContext => ({
  enabled: computed(() => true),
  isGenerating: ref(false),
  generate: vi.fn(async (): Promise<GenerateSdkResult> => overrides.result ?? { ok: true }),
  ...overrides,
})

const mountButton = (context: GenerateSdkContext) =>
  mount(GenerateSdkButton, {
    global: { provide: { [GENERATE_SDK_CONTEXT_SYMBOL as symbol]: context } },
  })

describe('GenerateSdkButton', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a button named Generate SDK when the context is enabled', () => {
    const wrapper = mountButton(createContext())

    const button = wrapper.get('button')
    expect(button.text()).toBe('Generate SDK')
    expect(button.attributes('type')).toBe('button')
  })

  it('renders nothing when the reference is not running locally', () => {
    const wrapper = mountButton(createContext({ enabled: computed(() => false) }))

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('runs the generate flow on click', async () => {
    const context = createContext()
    const wrapper = mountButton(context)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(context.generate).toHaveBeenCalledTimes(1)
    expect(toast).not.toHaveBeenCalled()
  })

  it('shows an error toast when the document cannot be exported', async () => {
    const wrapper = mountButton(createContext({ result: { ok: false, reason: 'export-failed' } }))

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(toast).toHaveBeenCalledWith('Unable to export active document', 'error')
  })

  it('shows the upload error message when the upload fails', async () => {
    const wrapper = mountButton(
      createContext({ result: { ok: false, reason: 'upload-failed', message: 'Server responded with 500' } }),
    )

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(toast).toHaveBeenCalledWith('Server responded with 500', 'error')
  })

  it('exposes the busy state while uploading', () => {
    const wrapper = mountButton(createContext({ isGenerating: ref(true) }))

    expect(wrapper.get('button').attributes('aria-busy')).toBe('true')
  })
})
