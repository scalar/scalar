/**
 * TODO: This is a copy of projects/web/src/stores/utility.ts
 */
import { type KeyOfType } from '@anc/ts-helpers'

/** Generic set item for a given store state */
export function setItemFactory<State extends object>(state: State) {
  return function setItem<K extends keyof State>(key: K, value: State[K]) {
    state[key] = value
  }
}

export function toggleItemFactory<State extends object>(state: State) {
  return function toggleItem(key: KeyOfType<State, boolean>) {
    if (typeof state[key] === 'boolean') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      state[key] = !state[key]
    }
  }
}
