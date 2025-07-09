import { type InjectionKey, inject, provide } from 'vue'

type SidebarGroupOptions = {
  /** Increment the level of the sidebar groups */
  increment?: boolean
  /** Reset the level of the sidebar groups */
  reset?: boolean
}

/**
 * The level of the sidebar groups
 *
 * We shouldn't go deeper than 6 levels
 */
export type SidebarGroupLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Tracks the level of the sidebar groups
 *
 * @default 0
 */
export const SIDEBAR_GROUPS_SYMBOL = Symbol() as InjectionKey<SidebarGroupLevel>

/**
 * Get the current level of the sidebar groups
 *
 * Optionally increments or resets the level of the sidebar groups
 * Always returns the current level even if the level is incremented or reset
 */
export const useSidebarGroups = (options: SidebarGroupOptions = {}) => {
  const { increment = false, reset = false } = options

  const level = inject(SIDEBAR_GROUPS_SYMBOL, 0)

  if (reset) {
    provide(SIDEBAR_GROUPS_SYMBOL, 0)
  } else if (increment && level < 6) {
    provide(SIDEBAR_GROUPS_SYMBOL, (level + 1) as SidebarGroupLevel)
  } else {
    provide(SIDEBAR_GROUPS_SYMBOL, level)
  }

  return { level }
}
