import type { ScalarIconComponent } from '@scalar/icons/types'

import type { LoadingState } from '@/components/ScalarLoading'

/** Styles for the ScalarButton component */
export type ButtonVariant = 'solid' | 'outlined' | 'ghost' | 'danger'

/** Sizes for the ScalarButton component */
export type ButtonSize = 'xs' | 'sm' | 'md'

/** Utility type for class names */
export type ClassList = string | string[]

/** Props for the ScalarButton component */
export type ScalarButtonProps = {
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
   * @see <ScalarLoading>
   *
   * @example
   * import { useLoadingState } from '@scalar/components'
   * ...
   * const loadingState = useLoadingState()
   * loadingState.startLoading()
   * ...
   * <ScalarButton :loading="loadingState">
   *   It's loading...
   * </ScalarButton>
   */
  loading?: LoadingState
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
}
