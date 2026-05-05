import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, watch } from 'vue'

import { usePathMasking } from './use-path-masking'

type HarnessProps = {
  shouldMask: () => boolean
  onMask: () => void
}

/**
 * Mounts a throwaway component so the composable has an owner instance and
 * its watchers behave like they would inside a real component. Returns the
 * reactive inputs plus the composable return value.
 */
const mountHarness = (props: HarnessProps) => {
  const isReady = ref<unknown>(null)
  const operationKey = ref(0)

  const Harness = defineComponent({
    setup() {
      usePathMasking({
        isReady: () => isReady.value,
        operationKey: () => operationKey.value,
        shouldMask: props.shouldMask,
        onMask: props.onMask,
      })
      return () => h('div')
    },
  })

  const wrapper = mount(Harness)

  return {
    wrapper,
    isReady,
    operationKey,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePathMasking', () => {
  it('does not mask while the ready signal is falsy', async () => {
    const onMask = vi.fn()
    const { operationKey } = mountHarness({ shouldMask: () => true, onMask })

    operationKey.value = 1
    await nextTick()

    expect(onMask).not.toHaveBeenCalled()
  })

  it('masks once the ready signal becomes truthy and the predicate passes', async () => {
    const onMask = vi.fn()
    const { isReady } = mountHarness({ shouldMask: () => true, onMask })

    isReady.value = {}
    await nextTick()

    expect(onMask).toHaveBeenCalledTimes(1)
  })

  it('does not mask when the predicate returns false', async () => {
    const onMask = vi.fn()
    const { isReady } = mountHarness({ shouldMask: () => false, onMask })

    isReady.value = {}
    await nextTick()

    expect(onMask).not.toHaveBeenCalled()
  })

  it('masks again when operationKey changes', async () => {
    const onMask = vi.fn()
    const { isReady, operationKey } = mountHarness({ shouldMask: () => true, onMask })

    isReady.value = {}
    await nextTick()
    expect(onMask).toHaveBeenCalledTimes(1)

    operationKey.value = 1
    await nextTick()
    expect(onMask).toHaveBeenCalledTimes(2)
  })

  it('runs onMask after sibling pre-flush watchers that react to the same operationKey', async () => {
    /**
     * Regression for the CodeInput content-sync race. When the parent (our
     * hook) and a child (e.g. CodeInput's `modelValue` → CodeMirror sync)
     * both watch `operationKey`, the child's pre-flush watcher runs after
     * the parent's and would overwrite our clear with the new path value.
     *
     * Using `flush: 'post'` inside the hook guarantees our mask runs after
     * all pre-flush watchers, so the clear sticks.
     */
    const isReady = ref<unknown>(null)
    const operationKey = ref('initial')
    let lastContent = ''

    const Harness = defineComponent({
      setup() {
        // Hook's watcher is registered first — without `flush: 'post'` it
        // would run before the sibling below and its clear would be
        // overwritten.
        usePathMasking({
          isReady: () => isReady.value,
          operationKey: () => operationKey.value,
          shouldMask: () => true,
          onMask: () => {
            lastContent = ''
          },
        })

        // Sibling pre-flush watcher — simulates CodeInput syncing `modelValue`
        // into the CodeMirror instance on each prop change.
        watch(operationKey, (next) => {
          lastContent = String(next)
        })

        return () => h('div')
      },
    })

    mount(Harness)

    isReady.value = {}
    await nextTick()

    operationKey.value = '/_scalar_temp1a2b3c4d'
    await nextTick()

    expect(lastContent).toBe('')
  })
})
