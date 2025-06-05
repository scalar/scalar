import type { VariantProps } from 'cva'
import type { variants } from './variants'
import type { Icon, Logo } from '@/components/ScalarIcon/utils'

/**
 * Variants types for the ScalarIcon component
 */
type IconVariants = VariantProps<typeof variants>

/**
 * Props for the ScalarIcon component
 */
export type ScalarIconProps = {
  icon?: Icon
  logo?: Logo
  size?: IconVariants['size']
  thickness?: string
  label?: string
}
