import { useModal } from '@scalar/components'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { releaseNotes } from '../data/release-notes'
import { WHATS_NEW_LAST_SEEN_KEY } from '../hooks/use-whats-new'
import WhatsNewModal from './WhatsNewModal.vue'

enableAutoUnmount(afterEach)

/**
 * `ScalarModal` teleports its body via Headless UI's `Dialog`, so the
 * rendered nodes live outside the Vue Test Utils wrapper subtree. These
 * helpers query the live document instead.
 */
const queryRenderedTitles = (): string[] => {
  return Array.from(document.querySelectorAll('h3')).map((node) => node.textContent?.trim() ?? '')
}

const queryShowMoreButton = (): HTMLButtonElement | null => {
  const buttons = Array.from(document.querySelectorAll('button'))
  return (
    (buttons.find((button) => button.textContent?.includes('Show older releases')) as HTMLButtonElement | undefined) ??
    null
  )
}

describe('WhatsNewModal', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders the first batch of release notes when opened', async () => {
    const state = useModal()
    mount(WhatsNewModal, { props: { state } })

    state.show()
    await nextTick()
    await nextTick()

    const titles = queryRenderedTitles()
    expect(titles.length).toBeGreaterThan(0)
    expect(titles.length).toBeLessThanOrEqual(5)
    expect(titles[0]).toBe(releaseNotes[0]?.title)
  })

  it('reveals additional notes when "Show older releases" is clicked', async () => {
    const state = useModal()
    mount(WhatsNewModal, { props: { state } })

    state.show()
    await nextTick()
    await nextTick()

    const initialCount = queryRenderedTitles().length
    const button = queryShowMoreButton()

    // The "Show older releases" button only appears when there are entries
    // beyond the first batch. With the curated list having more than 5
    // entries today, we expect it; if the data ever shrinks below the
    // threshold the test should still document the contract.
    if (releaseNotes.length <= initialCount) {
      expect(button).toBeNull()
      return
    }

    expect(button).not.toBeNull()
    button?.click()
    await nextTick()

    expect(queryRenderedTitles().length).toBeGreaterThan(initialCount)
  })

  it('marks the latest release as seen when the modal opens', async () => {
    const state = useModal()
    mount(WhatsNewModal, { props: { state } })

    expect(localStorage.getItem(WHATS_NEW_LAST_SEEN_KEY)).toBeNull()

    state.show()
    await nextTick()

    expect(localStorage.getItem(WHATS_NEW_LAST_SEEN_KEY)).toBe(releaseNotes[0]?.version)
  })
})
