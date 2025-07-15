/** A collection of tools which are used strictly for testing */

import { vi } from 'vitest'
import { computed, ref } from 'vue'

export const createMockSidebar = (collapsedItems: Record<string, boolean> = {}) => ({
  collapsedSidebarItems: collapsedItems,
  isSidebarOpen: ref(true),
  items: computed(() => ({ entries: [], titles: new Map() })),
  scrollToOperation: vi.fn(),
  setCollapsedSidebarItem: vi.fn(),
  toggleCollapsedSidebarItem: vi.fn(),
})
