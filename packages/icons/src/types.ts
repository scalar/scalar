/**
 * The weight of the icon.
 *
 * @see https://phosphoricons.com/
 */
export type ScalarIconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'

/**
 * The props for the ScalarIcon component.
 */
export type ScalarIconProps = {
  /**
   * An accessible label for the icon.
   *
   * If not provided, the icon will be hidden from assistive technologies.
   */
  label?: string
  /**
   * The weight of the icon.
   *
   * @default 'regular'
   */
  weight?: ScalarIconWeight
}
