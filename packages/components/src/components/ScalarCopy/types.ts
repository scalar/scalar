export type ScalarCopyPlacement = 'left' | 'right'

export type ScalarCopyProps = {
  /** The content to copy to the clipboard */
  content?: string
  /** The placement of the label relative to the copy button */
  placement?: ScalarCopyPlacement
  /**
   * Whether the label should always be shown or only when the copy button is hovered
   */
  showLabel?: boolean
  /**
   * The duration to show the copied state after the copy button is clicked in milliseconds
   *
   * @default 1500
   */
  duration?: number
}

export type ScalarCopySlots = {
  /** The label shown next to the copy button before it is clicked */
  copy?: () => unknown
  /** The label shown next to the copy button after it is clicked */
  copied?: () => unknown
  /**
   * Overrides the backdrop for the label
   *
   * This should match the background color of the parent
   * container to ensure the label is legible
   */
  backdrop?(): unknown
}
