import type ScalarMenu from './ScalarMenu.vue'
import type ScalarMenuButton from './ScalarMenuButton.vue'

/**
 * Slots for the ScalarMenuButton component
 * @see {@link ScalarMenuButton}
 */
export type ScalarMenuButtonSlots = {
  /** Adds a label to the menu button next to the logo */
  'label'?: () => any
  /**
   * Overrides the logo in the menu button
   * @default <ScalarIcon icon="Logo" />
   * @example <img class="h-full aspect-square bg-b-3 rounded" :src="..." />
   */
  'logo'?: () => any
  /**
   * Overrides the screen reader label in the menu button
   * @default open ? 'Close Menu' : 'Open Menu'
   */
  'sr-label'?: () => any
}

/**
 * Props for the ScalarMenuButton component and the ScalarMenu button slot
 * @see {@link ScalarMenuButton}
 */
export type ScalarMenuButtonProps = {
  /** Whether the menu is open */
  open: boolean
}

/**
 * Props for the ScalarMenu component
 * @see {@link ScalarMenu}
 */
export type ScalarMenuSlotProps = {
  /** A callback to close the menu */
  close: () => void
}
