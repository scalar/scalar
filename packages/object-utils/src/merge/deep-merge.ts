import { merge } from 'ts-deepmerge'

/** Deep merge utility for objects */
export function deepMerge<T extends object, I extends Partial<T>>(target: T, ...args: I[]) {
  return merge(target, ...args) as T
}
