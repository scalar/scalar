import {
  type FilterFunction,
  JSONPathEnvironment,
  type JSONPathQuery,
  type JSONValue,
  LOGICAL_TYPE,
  VALUE_TYPE,
} from 'json-p3'

import { compileOverlayRegExp } from '@/helpers/overlay-regexp'

/** Resource limits shared by every action in one Overlay composition. */
export type OverlayCompositionLimits = {
  actions: number
  documentSize: number
  matches: number
  patternLength: number
  regexPatterns: number
  regexProgramSize: number
  selectorLength: number
  work: number
}

const DEFAULT_LIMITS: OverlayCompositionLimits = {
  actions: 1_000,
  documentSize: 64 * 1024 * 1024,
  matches: 50_000,
  patternLength: 512,
  regexPatterns: 32,
  regexProgramSize: 4_096,
  selectorLength: 4_096,
  work: 2_000_000,
}

type OverlayCompositionBudget = {
  compile: (selector: string) => JSONPathQuery
  read: (document: JSONValue, selector: string) => JSONValue
  unwrap: (value: JSONValue) => JSONValue
  reserveActions: (count: number) => void
  reserveSize: (size: number) => void
  spendWork: (work: number) => void
  checkMatch: (count: number, location: readonly (string | number)[]) => void
  serialize: (value: unknown, validate?: (key: string, value: unknown) => void) => { json: string; size: number }
}

/** Bounds selector evaluation and conservatively accounts for values added to the working document. */
export const createOverlayCompositionBudget = (
  overrides?: Partial<OverlayCompositionLimits>,
): OverlayCompositionBudget => {
  const limits = { ...DEFAULT_LIMITS, ...overrides }
  let remainingWork = limits.work
  let remainingSize = limits.documentSize
  let remainingActions = limits.actions
  const spendWork = (work: number): void => {
    remainingWork -= work
    if (remainingWork < 0) {
      throw new Error('Overlay composition exceeded its work budget')
    }
  }

  const regexes = new Map<string, ReturnType<typeof compileOverlayRegExp>>()
  // Charge actual matcher transitions across all actions, in the same scale as string reads.
  const spendRegexTransition = (): void => spendWork(1 / 32)
  const regexFunction = (fullMatch: boolean): FilterFunction => ({
    argTypes: [VALUE_TYPE, VALUE_TYPE],
    returnType: LOGICAL_TYPE,
    call: (text, pattern): boolean => {
      if (typeof text !== 'string' || typeof pattern !== 'string') {
        return false
      }
      if (pattern.length > limits.patternLength) {
        throw new Error('Overlay JSONPath regular expression exceeded its length limit')
      }
      let compiled = regexes.get(pattern)
      if (compiled === undefined) {
        if (regexes.size >= limits.regexPatterns) {
          throw new Error('Overlay composition exceeded its regular expression limit')
        }
        spendWork(1 + pattern.length)
        compiled = compileOverlayRegExp(pattern, limits.regexProgramSize, spendRegexTransition)
        regexes.set(pattern, compiled)
      }
      if (!compiled) {
        return false
      }
      // Treffer checks the subject's Unicode scalars before visiting any matcher states.
      spendWork(1 + Math.ceil(text.length / 32))
      return compiled(text, fullMatch)
    },
  })
  const environment = new JSONPathEnvironment()
  environment.functions['match'] = regexFunction(true)
  environment.functions['search'] = regexFunction(false)

  const originalValues = new WeakMap<object, JSONValue>()

  return {
    compile: (selector) => {
      if (selector.length > limits.selectorLength) {
        throw new Error('Overlay JSONPath selector exceeded its length limit')
      }
      spendWork(1 + selector.length)
      return environment.compile(selector)
    },
    read: (document, selector) => {
      // Charge reads inside the evaluator, including scans that produce zero matches
      // and subqueries that materialize matches before yielding to the composer.
      const costPerRead = 1 + Math.ceil(selector.length / 32)
      const views = new WeakMap<object, JSONValue>()
      const wrap = (value: JSONValue, depth: number): JSONValue => {
        if (typeof value !== 'object' || value === null) {
          return value
        }
        const existing = views.get(value)
        if (existing) {
          return existing
        }
        // json-p3 carries a copy of the path to each candidate node.
        const cost = costPerRead + depth
        const proxy = new Proxy(value, {
          get(target, key, receiver) {
            spendWork(cost)
            const item: unknown = Reflect.get(target, key, receiver)
            if (typeof item === 'string') {
              spendWork(Math.ceil(item.length / 32))
            }
            return typeof item === 'object' && item !== null ? wrap(item as JSONValue, depth + 1) : item
          },
          getOwnPropertyDescriptor(target, key) {
            spendWork(cost)
            return Reflect.getOwnPropertyDescriptor(target, key)
          },
          ownKeys(target) {
            const keys = Reflect.ownKeys(target)
            spendWork(cost * (1 + keys.length))
            return keys
          },
        })
        views.set(value, proxy)
        originalValues.set(proxy, value)
        return proxy
      }
      return wrap(document, 0)
    },
    unwrap: (value) => (typeof value === 'object' && value !== null ? (originalValues.get(value) ?? value) : value),
    reserveActions: (count) => {
      remainingActions -= count
      if (remainingActions < 0) {
        throw new Error('Overlay composition exceeded its action limit')
      }
    },
    reserveSize: (size) => {
      remainingSize -= size
      if (remainingSize < 0) {
        throw new Error('Overlay composition exceeded its document size budget')
      }
    },
    spendWork,
    checkMatch: (count, location) => {
      if (count > limits.matches) {
        throw new Error('Overlay JSONPath selector exceeded its match limit')
      }
      // Account for path normalization before it allocates strings for deduplication.
      spendWork(1 + location.length)
      for (const part of location) {
        if (typeof part === 'string') {
          spendWork(Math.ceil(part.length / 32))
        }
      }
    },
    serialize: (value, validate) => {
      let size = 0
      const json = JSON.stringify(value, (key, item: unknown) => {
        const textLength = key.length + (typeof item === 'string' ? item.length : 0)
        // Allow for escaping and for the memory cost of retaining many small nodes.
        size += 32 + 6 * textLength
        if (size > limits.documentSize) {
          throw new Error('Overlay composition exceeded its document size budget')
        }
        spendWork(1 + Math.ceil(textLength / 32))
        validate?.(key, item)
        return item
      })
      return { json, size }
    },
  }
}
