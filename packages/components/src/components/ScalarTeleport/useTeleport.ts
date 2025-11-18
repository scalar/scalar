import type { MaybeElementRef } from '@vueuse/core'
import { type InjectionKey, inject, provide, ref } from 'vue'

/**
 * The teleport target
 */
export const TELEPORT_SYMBOL = Symbol() as InjectionKey<MaybeElementRef>

/**
 * Get the nearest teleport target id from `useProvideTeleport`
 *
 * Falls back to `body` if no teleport target id is found
 *
 * @see {@link useProvideTeleport}
 */
export const useTeleport = () => inject(TELEPORT_SYMBOL, undefined)

/**
 * Provides a teleport target id using Vue's `provide`
 *
 * @see https://vuejs.org/guide/components/provide-inject.html#provide-inject
 */
export const useProvideTeleport = (targetRef?: MaybeElementRef) => {
  const target = targetRef ?? ref<HTMLElement>()
  provide(TELEPORT_SYMBOL, target)
  return target
}
