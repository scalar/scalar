export type ExpectChain = {
  to: {
    [key: string]: any
    exist: () => boolean
    be: {
      [key: string]: any
      below: (expected: number) => boolean
      an: (type: string) => boolean
      oneOf: (expected: any[]) => boolean
      null: () => boolean
      undefined: () => boolean
      empty: () => boolean
      true: () => boolean
      false: () => boolean
      above: (expected: number) => boolean
      at: {
        least: (expected: number) => boolean
      }
    }
    include: (expected: string) => boolean
    have: {
      [key: string]: any
      length: (expected: number) => boolean
      property: (name: string, value?: any) => boolean
      keys: (keys: string[]) => boolean
    }
    equal: (expected: any) => boolean
    deep: {
      equal: (expected: any) => boolean
    }
    match: (pattern: RegExp) => boolean
    eql: (expected: any) => boolean
  }
  not: {
    to: ExpectChain['to']
  }
}

export const createExpectChain = (actual: any): ExpectChain => {
  if (actual instanceof Promise) {
    throw new Error('Expected value cannot be a Promise. Make sure to await async values before using expect.')
  }

  const chain = {
    to: {
      exist: () => {
        if (actual === null || actual === undefined) {
          throw new Error(`Expected value to exist but got ${actual}`)
        }
        return true
      },
      be: {
        below: (expected: number) => {
          if (typeof actual !== 'number') {
            throw new Error('Expected value to be a number')
          }
          if (actual >= expected) {
            throw new Error(`Expected ${actual} to be below ${expected}`)
          }
          return true
        },
        an: (type: string) => {
          const actualType = Array.isArray(actual) ? 'array' : typeof actual
          if (actualType !== type) {
            throw new Error(`Expected ${JSON.stringify(actual)} to be an ${type}, but got ${actualType}`)
          }
          return true
        },
        oneOf: (expected: any[]) => {
          if (!Array.isArray(expected)) {
            throw new Error('Expected argument to be an array')
          }
          if (!expected.includes(actual)) {
            throw new Error(`Expected ${JSON.stringify(actual)} to be one of ${JSON.stringify(expected)}`)
          }
          return true
        },
        null: () => {
          if (actual !== null) {
            throw new Error('Expected value to be null')
          }
          return true
        },
        undefined: () => {
          if (actual !== undefined) {
            throw new Error('Expected value to be undefined')
          }
          return true
        },
        empty: () => {
          if (Array.isArray(actual)) {
            if (actual.length !== 0) {
              throw new Error('Expected array to be empty')
            }
          } else if (typeof actual === 'string') {
            if (actual !== '') {
              throw new Error('Expected string to be empty')
            }
          } else if (typeof actual === 'object' && actual !== null) {
            if (Object.keys(actual).length !== 0) {
              throw new Error('Expected object to be empty')
            }
          } else {
            throw new Error('Expected value to be an array, string, or object')
          }
          return true
        },
        true: () => {
          if (actual !== true) {
            throw new Error('Expected value to be true')
          }
          return true
        },
        false: () => {
          if (actual !== false) {
            throw new Error('Expected value to be false')
          }
          return true
        },
        above: (expected: number) => {
          if (typeof actual !== 'number') {
            throw new Error('Expected value to be a number')
          }
          if (actual <= expected) {
            throw new Error(`Expected ${actual} to be above ${expected}`)
          }
          return true
        },
        at: {
          least: (expected: number) => {
            if (typeof actual !== 'number') {
              throw new Error('Expected value to be a number')
            }
            if (actual < expected) {
              throw new Error(`Expected ${actual} to be at least ${expected}`)
            }
            return true
          },
        },
      },
      include: (expected: string) => {
        if (typeof actual !== 'string') {
          throw new Error('Expected value to be a string')
        }
        if (!actual.includes(expected)) {
          throw new Error(`Expected "${actual}" to include "${expected}"`)
        }
        return true
      },
      have: {
        length: (expected: number) => {
          if (typeof actual?.length !== 'number') {
            throw new Error('Expected value to have a length property')
          }
          if (actual.length !== expected) {
            throw new Error(`Expected ${JSON.stringify(actual)} to have length ${expected} but got ${actual.length}`)
          }
          return true
        },
        property: (name: string, value?: any) => {
          if (typeof actual !== 'object' || actual === null || !Object.prototype.hasOwnProperty.call(actual, name)) {
            throw new Error(`Expected object to have property "${name}"`)
          }
          if (value !== undefined && actual[name] !== value) {
            throw new Error(`Expected property "${name}" to equal ${value} but got ${actual[name]}`)
          }
          return true
        },
        keys: (keys: string[]) => {
          if (typeof actual !== 'object' || actual === null) {
            throw new Error('Expected value to be an object')
          }
          const missingKeys = keys.filter((key) => !Object.prototype.hasOwnProperty.call(actual, key))
          if (missingKeys.length > 0) {
            throw new Error(`Expected object to have keys: ${missingKeys.join(', ')}`)
          }
          return true
        },
      },
      equal: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`)
        }
        return true
      },
      deep: {
        equal: (expected: any) => {
          const actualStr = JSON.stringify(actual)
          const expectedStr = JSON.stringify(expected)
          if (actualStr !== expectedStr) {
            throw new Error(`Expected ${actualStr} to deeply equal ${expectedStr}`)
          }
          return true
        },
      },
      match: (pattern: RegExp) => {
        if (typeof actual !== 'string') {
          throw new Error('Expected value to be a string')
        }
        if (!pattern.test(actual)) {
          throw new Error(`Expected "${actual}" to match ${pattern}`)
        }
        return true
      },
      eql: (expected: any) => {
        const actualStr = JSON.stringify(actual)
        const expectedStr = JSON.stringify(expected)
        if (actualStr !== expectedStr) {
          throw new Error(`Expected ${actualStr} to deeply equal ${expectedStr}`)
        }
        return true
      },
    },
  } as ExpectChain

  // Create the negated version of all assertions
  const not = {
    to: Object.entries(chain.to).reduce<ExpectChain['to']>(
      (acc, [key, value]) => {
        if (typeof value === 'function') {
          acc[key] = (...args: any[]) => {
            try {
              ;(value as Function)(...args)
            } catch {
              // If the original assertion failed, the negation passes
              return true
            }
            // If we get here, the original assertion passed, so the negation should fail
            throw new Error(
              `Expected ${JSON.stringify(actual)} to not ${key} ${args.map((arg) => JSON.stringify(arg)).join(', ')}`,
            )
          }
        } else if (typeof value === 'object') {
          acc[key] = Object.entries(value as Record<string, any>).reduce<Record<string, any>>(
            (subAcc, [subKey, subValue]) => {
              if (typeof subValue === 'function') {
                subAcc[subKey] = (...args: any[]) => {
                  try {
                    ;(subValue as Function)(...args)
                  } catch {
                    // If the original assertion failed, the negation passes
                    return true
                  }
                  // If we get here, the original assertion passed, so the negation should fail
                  throw new Error(
                    `Expected ${JSON.stringify(actual)} to not ${key}.${subKey} ${args
                      .map((arg) => JSON.stringify(arg))
                      .join(', ')}`,
                  )
                }
              }
              return subAcc
            },
            {},
          )
        }
        return acc
      },
      {} as ExpectChain['to'],
    ),
  }

  return { ...chain, not }
}
