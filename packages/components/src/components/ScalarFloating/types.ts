import type { Middleware, Placement } from '@floating-ui/vue'
import type { Ref } from 'vue'

export type FloatingOptions = {
  /**
   * Where to place the floating element relative to its reference element.
   * @default 'bottom'
   */
  placement?: Placement
  /**
   * Whether or not track the reference element's width
   * If enabled it will set `width` slot prop of the floating slot
   */
  resize?: boolean
  /**
   * Override the targetRef, useful if we are not passing a button
   * into the slot but is controlled from an external button
   */
  targetRef?: HTMLElement
  /**
   * Floating UI Middleware to be passed to Floating UI
   * @see https://floating-ui.com/docs/computePosition#middleware
   */
  middleware?: Middleware[]
  /**
   * Whether the floating element is open or not.
   * @default false
   */
  isOpen?: boolean
  /**
   * Whether to teleport the floating element.
   * Can be an `id` to teleport to or `true` to teleport to the `<body>`.
   * @default false
   */
  teleport?: boolean | string
}
