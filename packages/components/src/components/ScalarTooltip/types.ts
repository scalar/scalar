import type { Placement as FloatingPlacement } from '@floating-ui/vue'
import type { MaybeRef } from 'vue'

/** Timer Utility Type */
export type Timer = ReturnType<typeof setTimeout>

/** Might be an element or undefined */
export type MaybeElement = Element | undefined | null

export type ScalarTooltipPlacement = FloatingPlacement | undefined

/** The configuration for the active tooltip */
export type TooltipConfiguration = {
  /** The text content for the tooltip */
  content: MaybeRef<string>
  /**
   * Whether the content should be injected as innerHTML or as textContent
   *
   * FOR INTERNAL USE ONLY
   *
   * Should be used with caution and not to render user-provided content
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
   *
   * @default 'textContent'
   */
  contentTarget?: MaybeRef<'innerHTML' | 'textContent'>
  /**
   * The placement for the tooltip
   *
   * @see https://floating-ui.com/docs/computeposition#placement
   *  */
  placement?: MaybeRef<ScalarTooltipPlacement>
  /**
   * The delay before showing the tooltip in milliseconds
   *
   * @default 300
   */
  delay?: MaybeRef<number>
  /**
   * The offset between the target and the tooltip in pixels
   *
   * @default 4
   */
  offset?: MaybeRef<number>
  /** The target element ref */
  targetRef: MaybeRef<MaybeElement>
}

export type PublicTooltipConfiguration = Omit<TooltipConfiguration, 'contentTarget'>

export type ScalarTooltipProps = {
  content?: string
  delay?: number
  placement?: ScalarTooltipPlacement
  offset?: number
}
