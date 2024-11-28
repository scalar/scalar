import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useResizeWithTarget } from './useResizeWithTarget'

/**
 * Unfortunately we can't test the ResizeObserver with vitest but we can test the hook options
 */
describe('useResizeWithTarget', () => {
  it('returns a width by default', async () => {
    const el = ref<Element>()
    const { width } = useResizeWithTarget(el)

    expect(width.value).toBe('0px')
  })

  it('returns undefined if enabled is false', async () => {
    const el = ref<Element>()
    const { width } = useResizeWithTarget(el, { enabled: ref(false) })

    expect(width.value).toBeUndefined()
  })

  it('is reactive to changing the enabled ref', async () => {
    const el = ref<Element>()
    const enabled = ref(false)

    const { width } = useResizeWithTarget(el, { enabled })
    expect(width.value).toBeUndefined()

    enabled.value = true
    expect(width.value).toBe('0px')

    enabled.value = false
    expect(width.value).toBeUndefined()
  })
})
