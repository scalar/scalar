import type { Middleware, OffsetOptions, Placement } from '@floating-ui/vue'

/** The props for the ScalarFloating component */
export type FloatingOptions = {
  /**
   * Where to place the floating element relative to its reference element.
   * @default 'bottom'
   *
   * @see https://floating-ui.com/docs/computePosition#placement
   */
  placement?: Placement
  /**
   * The offset of the floating element relative to its reference element.
   * @default 5 (5px)
   *
   * @see https://floating-ui.com/docs/offset
   */
  offset?: OffsetOptions
  /**
   * Whether or not track the reference element's width
   * If enabled it will set `width` slot prop of the floating slot
   *
   * To match the width / height or the content try adding the `w-fit` to the class
   */
  resize?: boolean
  /**
   * Override the target, useful if we are not passing a button
   * into the slot but is controlled from an external button
   *
   * Can be a string id or a reference to an element
   */
  target?: string | HTMLElement
  /**
   * Floating UI Middleware to be passed to Floating UI
   *
   * Overrides the default middleware
   *
   * @example
   * ```ts
   * // change the offset to 10px
   * middleware: [offset(10)]
   * ```
   * @see https://floating-ui.com/docs/computePosition#middleware
   */
  middleware?: Middleware[]
  /**
   * Whether to teleport the floating element.
   * Can be an `id` to teleport to or `true` to teleport to the nearest `<ScalarTeleportRoot>` (or `<body>`).
   *
   * @see {@link ScalarTeleportRoot}
   * @default false
   */
  teleport?: boolean | string
}
