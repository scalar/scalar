import { describe, expect, it } from 'vitest'

import { useModal } from './useModal'

describe('useModal', () => {
  it('defaults to false', () => {
    const state = useModal()

    expect(state.open).toBe(false)
  })

  it('returns true when open', () => {
    const state = useModal()

    state.show()

    expect(state.open).toBe(true)
  })

  it('returns false when closed', () => {
    const state = useModal()

    state.show()
    state.hide()

    expect(state.open).toBe(false)
  })
})
