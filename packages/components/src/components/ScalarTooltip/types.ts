import type { Placement } from '@floating-ui/vue'
import type { MaybeRef } from 'vue'

/** Timer Utility Type */
export type Timer = ReturnType<typeof setTimeout>

/** Might be an element or undefined */
export type MaybeElement = Element | undefined | null

/** The configuration for the active tooltip */
export type TooltipConfiguration = {
  content: MaybeRef<string>
  placement?: MaybeRef<Placement>
  delay?: MaybeRef<number>
  offset?: MaybeRef<number>
  targetRef: MaybeRef<MaybeElement>
}
