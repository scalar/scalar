import { flushPromises, type mount } from '@vue/test-utils'
import { expect, vi } from 'vitest'
import { nextTick } from 'vue'

type Mounted = ReturnType<typeof mount>

/** Radix sets `aria-expanded` on the menu trigger. */
const scalarMenuTriggerSelector = 'button[aria-expanded]' as const

export const getScalarMenuTrigger = (wrapper: Mounted) => wrapper.get(scalarMenuTriggerSelector)

const portaledMenuRoot = (triggerButton: HTMLButtonElement): HTMLElement | null => {
  const contentId = triggerButton.getAttribute('aria-controls')
  if (contentId) {
    const byId = document.getElementById(contentId)
    if (byId) {
      return byId
    }
  }
  return document.querySelector('[data-radix-menu-content][data-state="open"]')
}

/**
 * Clicks the menu trigger and resolves the open dropdown surface in `document`.
 * Vue Test Utils scopes `find` / `get` to the wrapper root, so portaled content
 * must be queried from the returned element (or `document`).
 */
export const openScalarMenuPanel = async (wrapper: Mounted): Promise<HTMLElement> => {
  await getScalarMenuTrigger(wrapper).trigger('click')
  await nextTick()
  await flushPromises()

  const triggerButton = getScalarMenuTrigger(wrapper).element as HTMLButtonElement

  await vi.waitFor(
    () => {
      expect(portaledMenuRoot(triggerButton)).not.toBeNull()
    },
    { interval: 10, timeout: 3000 },
  )

  const panel = portaledMenuRoot(triggerButton)
  if (!panel) {
    throw new Error('ScalarMenu panel not found after vi.waitFor reported success')
  }
  return panel
}
