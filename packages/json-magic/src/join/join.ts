import { isObject } from '@scalar/helpers/object/is-object'

import type { UnknownObject } from '../types'

/** Controls how a value is combined with the value from earlier inputs. */
export type JoinStrategy = 'merge' | 'merge-by-index' | 'replace' | 'conflict' | 'skip' | { uniqueBy: string }

/** Context for choosing a strategy. Paths are segments, so keys containing slashes stay intact. */
export type JoinContext = {
  path: readonly string[]
  current: unknown
  incoming: unknown
}

/** Customize merging without coupling it to a document format. */
export type JoinOptions = {
  strategy?: (context: JoinContext) => JoinStrategy
}

/** A duplicate value at a location marked as a conflict by the caller. */
export type JoinConflict = { path: string[] }

/** Conflicts prevent returning a partially joined document. */
export type JoinResult = { ok: true; document: UnknownObject } | { ok: false; conflicts: JoinConflict[] }

/** Copy literal JSON keys as own data properties, without invoking prototype setters. */
const copy = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(copy)
  }
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, copy(child)]))
  }
  return value
}

/**
 * Join JSON objects without interpreting any document standard or resolving references.
 * Objects merge recursively; arrays and other values are replaced by later inputs.
 * A strategy can instead replace an entire object, reject duplicate keys (even equal
 * values), or combine arrays by a property, retaining the first occurrence.
 * Inputs must be acyclic JSON objects and are never mutated or shared with the result.
 */
export const join = (inputs: readonly UnknownObject[], options: JoinOptions = {}): JoinResult => {
  const conflicts: JoinConflict[] = []
  const skipped = Symbol('skipped')

  const mergeFields = (target: UnknownObject | unknown[], source: UnknownObject | unknown[], path: string[]): void => {
    for (const [key, value] of Object.entries(source)) {
      const hasKey = Object.hasOwn(target, key)
      const merged = combine(hasKey ? Reflect.get(target, key) : undefined, value, [...path, key], hasKey)
      if (merged !== skipped) {
        // Defining an own property preserves literal __proto__ keys without changing the prototype.
        Object.defineProperty(target, key, { value: merged, enumerable: true, configurable: true, writable: true })
      }
    }
  }

  const combine = (current: unknown, incoming: unknown, path: string[], exists: boolean): unknown => {
    const strategy = options.strategy?.({ path, current, incoming }) ?? 'merge'

    if (strategy === 'skip') {
      return skipped
    }

    if (strategy === 'conflict' && exists) {
      conflicts.push({ path })
      return current
    }

    if (typeof strategy === 'object' && Array.isArray(incoming)) {
      const seen = new Set<unknown>()
      return [...(Array.isArray(current) ? current : []), ...incoming]
        .filter((item) => {
          const key = isObject(item) && Object.hasOwn(item, strategy.uniqueBy) ? item[strategy.uniqueBy] : undefined
          // Items without the identity property remain distinct.
          if (key === undefined) {
            return true
          }
          if (seen.has(key)) {
            return false
          }
          seen.add(key)
          return true
        })
        .map(copy)
    }

    if (strategy === 'merge-by-index' && Array.isArray(incoming)) {
      const result = Array.isArray(current) ? current : []
      mergeFields(result, incoming, path)
      return result
    }

    if ((strategy === 'merge' || strategy === 'merge-by-index') && isObject(incoming)) {
      const result: UnknownObject = isObject(current) ? current : {}
      mergeFields(result, incoming, path)
      return result
    }

    return copy(incoming)
  }

  // The root always merges; strategies apply to fields within each document.
  const document: UnknownObject = {}
  for (const input of inputs) {
    mergeFields(document, input, [])
  }

  return conflicts.length ? { ok: false, conflicts } : { ok: true, document }
}
