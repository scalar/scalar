import type { Component } from 'vue'

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

/**
 * A ScalarIcon* component
 *
 * Useful for when you want to pass a ScalarIcon component as prop
 */
export type ScalarIconComponent = Component<ScalarIconProps>
