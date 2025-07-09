import type { ScalarListboxOption } from '../..'

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
   * @default The Scalar logo
   * @example <img class="h-full aspect-square bg-b-3 rounded" :src="..." />
   */
  logo?(): unknown
  /**
   * Overrides the screen reader label in the menu button
   * @default open ? 'Close Menu' : 'Open Menu'
   */
  label?(): unknown
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
