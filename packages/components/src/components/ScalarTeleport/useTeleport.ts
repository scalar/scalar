import { type InjectionKey, type Ref, inject, provide, useId } from 'vue'

/**
 * The teleport target
 */
export const TELEPORT_SYMBOL: InjectionKey<string | Ref<HTMLElement | null>> = Symbol()

/**
 * Get the nearest teleport target id from `useProvideTeleport`
 *
 * Falls back to `body` if no teleport target id is found
 *
 * @see {@link useProvideTeleport}
 */
export const useTeleport = () => inject(TELEPORT_SYMBOL, 'body')

/**
 * Provides a teleport target id using Vue's `provide`
 *
 * @see https://vuejs.org/guide/components/provide-inject.html#provide-inject
 */
export const useProvideTeleport = (id?: string, target?: Ref<HTMLElement | null>): string => {
  // `useId` produces ids that are stable across SSR and client hydration,
  // avoiding a mismatch on the teleport target id.
  const targetId = id ?? `scalar-teleport-${useId()}`
  provide(TELEPORT_SYMBOL, target ?? `#${targetId}`)
  return targetId
}
