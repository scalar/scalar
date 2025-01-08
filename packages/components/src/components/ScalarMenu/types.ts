import type { ScalarListboxOption } from '../..'
import type ScalarMenu from './ScalarMenu.vue'
import type ScalarMenuButton from './ScalarMenuButton.vue'
import type ScalarMenuTeamPicker from './ScalarMenuTeamPicker.vue'

/**
 * A team option for the ScalarMenuTeamPicker component
 * @see {@link ScalarMenuTeamPicker}
 */
export type ScalarMenuTeamOption = ScalarListboxOption & {
  /** The team's profile image */
  src?: string
}

/**
 * Slots for the ScalarMenuButton component
 * @see {@link ScalarMenuButton}
 */
export type ScalarMenuButtonSlots = {
  /**
   * Overrides the logo in the menu button
   * @default <ScalarIcon icon="Logo" />
   * @example <img class="h-full aspect-square bg-b-3 rounded" :src="..." />
   */
  logo?: () => any
  /**
   * Overrides the screen reader label in the menu button
   * @default open ? 'Close Menu' : 'Open Menu'
   */
  label?: () => any
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
