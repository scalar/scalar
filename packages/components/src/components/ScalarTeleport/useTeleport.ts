import { nanoid } from 'nanoid'
import { type InjectionKey, inject, provide } from 'vue'

/**
 * The teleport target
 */
export const TELEPORT_SYMBOL = Symbol() as InjectionKey<string>

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
export const useProvideTeleport = (id?: string) => {
  const targetId = id ?? `scalar-teleport-${nanoid()}`
  provide(TELEPORT_SYMBOL, `#${targetId}`)
  return targetId
}
