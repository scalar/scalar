/**
 * Manages the sidebar’s open/closed state across the app
 *
 * We keep track of whether the sidebar is open or closed in one central place,
 * so all parts of the app stay in sync. This makes it simple to toggle the
 * sidebar from anywhere and have everything update correctly.
 *
 * The sidebar also automatically opens/closes based on screen size to be
 * responsive on different devices.
 */

import { useLayout } from '@/hooks/useLayout'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'
import { ref, watch } from 'vue'

// Single source of truth for the sidebar state
const isSidebarOpen = ref(false)

// Initialize dependencies once at the module level
const { mediaQueries } = useBreakpoints()
const { layout } = useLayout()

// Set initial state based on layout type
isSidebarOpen.value = layout !== 'modal'

// Single watcher instance for handling responsive behavior
watch(mediaQueries.xl, (isXL) => (isSidebarOpen.value = isXL), {
  immediate: layout !== 'modal',
})

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

/**
 * Hook to access the shared sidebar state
 */
export function useSidebarToggle() {
  return {
    isSidebarOpen,
    toggleSidebar,
  }
}
