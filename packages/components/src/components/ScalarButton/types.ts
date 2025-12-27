import type { ScalarIconComponent } from '@scalar/icons/types'
import type { Component } from 'vue'

import type { LoadingState } from '../ScalarLoading/types'

/** Styles for the ScalarButton component */
export type ButtonVariant = 'solid' | 'outlined' | 'ghost' | 'gradient' | 'danger'

/** Sizes for the ScalarButton component */
export type ButtonSize = 'xs' | 'sm' | 'md'

/** Utility type for class names */
export type ClassList = string | string[]

/** Props for the ScalarButton component */
export type ScalarButtonProps = {
  /**
   * Overrides the rendered element
   *
   * @default 'button'
   *
   * @example
   * <ScalarButton is="a" href="https://scalar.com">
   *   I'm a link!
   * </ScalarButton>
   */
  is?: string | Component
  /**
   * The variant of the button
   *
   * @default 'solid'
   */
  variant?: ButtonVariant
  /**
   * The size of the button
   *
   * @default 'md'
   */
  size?: ButtonSize
  /**
   * Visually disables the button
   *
   * Note: This does not prevent interaction.
   *@see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled
   */
  disabled?: boolean
  /**
   * The icon to display in the button
   *
   * Use a component from the `@scalar/icons` package to display an icon.
   *
   * @example
   * import { ScalarIconAcorn } from '@scalar/icons'
   * ...
   * <ScalarButton :icon="ScalarIconAcorn">
   *   It's an acorn
   * </ScalarButton>
   */
  icon?: ScalarIconComponent
  /**
   * The loading state of the button
   *
   * @see ScalarLoading
   *
   * @example
   * import { ScalarButton, useLoadingState } from '@scalar/components'
   * ...
   * const loader = useLoadingState()
   * loader.start()
   * ...
   * <ScalarButton :loader>
   *   It's loading...
   * </ScalarButton>
   */
  loader?: LoadingState
}
