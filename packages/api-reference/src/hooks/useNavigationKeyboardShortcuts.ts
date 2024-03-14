import { useMagicKeys, whenever } from '@vueuse/core'

import { scrollToId } from '../helpers'
import type { Spec } from '../types'
import { useNavState } from './useNavState'
import { type SidebarEntry, useSidebar } from './useSidebar'

/**
 * Keyboard shortcuts for navigating to the next/previous section.
 *
 * Note: Should be just onced in the app. Otherwise it will register multiple times. :)
 */
export function useNavigationKeyboardShortcuts(options?: { parsedSpec: Spec }) {
  const { previousEntry, nextEntry, setCollapsedSidebarItem } =
    useSidebar(options)

  const { getSectionId } = useNavState()

  // Register keyboard shortcuts
  const keys = useMagicKeys()

  // Previous section
  whenever(keys.k, () => {
    goToSection(previousEntry.value)
  })

  // Next section
  whenever(keys.j, () => {
    goToSection(nextEntry.value)
  })

  // Scroll to the given section
  function goToSection(entry: SidebarEntry | undefined) {
    // If there is no entry, do nothing.
    if (!entry?.id) {
      return
    }

    // Make sure the sidebar item is expanded.
    setCollapsedSidebarItem(getSectionId(entry.id), true)

    // Scroll to the section.
    scrollToId(entry.id)
  }
}
