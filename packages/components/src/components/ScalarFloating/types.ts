import type { Middleware, Placement } from '@floating-ui/vue'

export type FloatingOptions = {
  /**
   * Where to place the floating element relative to its reference element.
   * @default 'bottom'
   * */
  placement?: Placement
  /**
   * Whether or not track the reference element's width
   * If enabled it will set `width` slot prop of the floating slot
   */
  resize?: boolean
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
   * Whether to teleport the floating element to the end of the document body.
   * @default false
   */
  teleport?: boolean
}
