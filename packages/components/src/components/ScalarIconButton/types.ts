import type { ScalarIconComponent, ScalarIconWeight } from '@scalar/icons/types'

import type { Variants } from './variants'
import type { Icon } from '../ScalarIcon'
import type { ScalarTooltipPlacement } from '@/components/ScalarTooltip'

export type ScalarIconButtonProps = {
  /**
   * An accessible label for the icon button
   *
   * If `tooltip` is true, this will be used as the tooltip content
   */
  label: string
  /**
   * The icon to display in the icon button
   *
   * Use a component from the `@scalar/icons` package to display
   * an icon. String values are deprecated.
   */
  icon: Icon | ScalarIconComponent
  /** Whether the icon button is disabled */
  disabled?: boolean
  /**
   * The variant of the icon button
   *
   * @default 'ghost'
   * @see <ScalarButton>
   */
  variant?: Variants['variant']
  /**
   * The size of the icon button
   *
   * @default 'md'
   */
  size?: Variants['size']
  /**
   * The thickness of the icon
   *
   * @deprecated Use the `weight` prop instead
   */
  thickness?: string
  /** The weight of the icon. */
  weight?: ScalarIconWeight
  /**
   * Whether to display a tooltip when hovering over the icon button
   *
   * If `true`, the `label` will be displayed when hovering over the
   * icon button. Can also be a specific placement for the tooltip.
   */
  tooltip?: boolean | ScalarTooltipPlacement
}
