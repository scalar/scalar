import { useActiveElement, useMagicKeys, whenever } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

import type { Spec } from '../types'
import { useNavState } from './useNavState'
import { type SidebarEntry, useSidebar } from './useSidebar'

/**
 * Keyboard shortcuts for navigating to the next/previous section.
 *
 * Note: Should be just onced in the app. Otherwise it will register multiple times. :)
 */
export function useNavigationKeyboardShortcuts(options?: { parsedSpec: Spec }) {
  const activeElement = useActiveElement()

  const notUsingInput = computed(
    () =>
      activeElement.value?.tagName !== 'INPUT' &&
      activeElement.value?.tagName !== 'TEXTAREA' &&
      // CodeMirror
      activeElement.value?.classList.contains('cm-content') === false,
  )

  const { previousEntry, nextEntry, setCollapsedSidebarItem } =
    useSidebar(options)

  const { getSectionId } = useNavState()

  // Register keyboard shortcuts
  const keys = useMagicKeys()

  // Previous section
  whenever(logicAnd(keys.k, notUsingInput), () => {
    goToSection(previousEntry.value, '')
  })

  // Next section
  whenever(logicAnd(keys.j, notUsingInput), () => {
    goToSection(nextEntry.value)
  })

  // Scroll to the given section
  function goToSection(entry: SidebarEntry | undefined, fallback?: string) {
    // If there is no entry, do nothing.
    if (!entry?.id) {
      if (fallback !== undefined) {
        window.location.hash = fallback
      }

      return
    }

    // Make sure the sidebar item is expanded.
    setCollapsedSidebarItem(getSectionId(entry.id), true)

    // Scroll to the section.
    //
    // Note: We can’t use scrollToId here, because some sections don’t have content and their height is 0. So there are in the view, but we can’t really scroll to them.
    window.location.hash = entry.id
  }
}
