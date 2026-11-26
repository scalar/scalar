import { ScalarFloating } from '@scalar/components/floating'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

enableAutoUnmount(afterEach)

describe('ScalarFloating.build', () => {
  beforeEach(() => {
    const target = document.createElement('div')
    target.id = 'built-floating-target'
    document.body.appendChild(target)

    return () => {
      target.remove()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts target IDs through the published entry point', async () => {
    const consoleSpy = vi.spyOn(console, 'warn')

    mount(ScalarFloating, { props: { target: 'built-floating-target' } })

    await nextTick()

    expect(consoleSpy).not.toHaveBeenCalled()
  })
})
