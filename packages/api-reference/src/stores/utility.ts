/**
 * TODO: This is a copy of projects/web/src/stores/utility.ts
 */
export type KeyOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: any
}

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
