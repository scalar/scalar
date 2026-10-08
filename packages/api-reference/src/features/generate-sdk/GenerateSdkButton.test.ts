import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

const mountButton = (context: GenerateSdkContext, variant?: 'toolbar' | 'card' | 'code') =>
  mount(GenerateSdkButton, {
    props: { variant },
    global: { provide: { [GENERATE_SDK_CONTEXT_SYMBOL as symbol]: context } },
  })

describe('GenerateSdkButton', () => {
  // The spinner fades out before an error toast shows, like the OAuth2 button
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
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
    await vi.runAllTimersAsync()

    expect(context.generate).toHaveBeenCalledTimes(1)
    expect(toast).not.toHaveBeenCalled()
  })

  it('shows an error toast when the document cannot be exported', async () => {
    const wrapper = mountButton(createContext({ result: { ok: false, reason: 'export-failed' } }))

    await wrapper.get('button').trigger('click')
    await vi.runAllTimersAsync()

    expect(toast).toHaveBeenCalledWith('Unable to export active document', 'error')
  })

  it('shows the upload error message when the upload fails', async () => {
    const wrapper = mountButton(
      createContext({ result: { ok: false, reason: 'upload-failed', message: 'Server responded with 500' } }),
    )

    await wrapper.get('button').trigger('click')
    await vi.runAllTimersAsync()

    expect(toast).toHaveBeenCalledWith('Server responded with 500', 'error')
  })

  it.each(['toolbar', 'code'] as const)('runs the generate flow from the %s variant', async (variant) => {
    const context = createContext()
    const wrapper = mountButton(context, variant)

    const button = wrapper.get('button')
    expect(button.text()).toBe('Generate SDK')

    await button.trigger('click')
    await vi.runAllTimersAsync()

    expect(context.generate).toHaveBeenCalledTimes(1)
  })

  it('ignores repeat clicks while the upload is still running', async () => {
    let finishUpload: (result: GenerateSdkResult) => void = () => undefined
    const context = createContext({
      generate: vi.fn(
        () =>
          new Promise<GenerateSdkResult>((resolve) => {
            finishUpload = resolve
          }),
      ),
    })
    const wrapper = mountButton(context)
    const button = wrapper.get('button')

    await button.trigger('click')
    await button.trigger('click')
    await vi.advanceTimersByTimeAsync(1000)

    expect(context.generate).toHaveBeenCalledTimes(1)

    // Once the upload settles the button works again
    finishUpload({ ok: true })
    await vi.runAllTimersAsync()
    await button.trigger('click')

    expect(context.generate).toHaveBeenCalledTimes(2)
  })

  it('exposes the busy state while uploading', () => {
    const wrapper = mountButton(createContext({ isGenerating: ref(true) }))

    expect(wrapper.get('button').attributes('aria-busy')).toBe('true')
  })
})
