import { describe, expect, it } from 'vitest'

import { preventPollution } from './prevent-pollution'

describe('preventPollution', () => {
  it('throws when __proto__ is passed', () => {
    expect(() => preventPollution('__proto__')).toThrow('Prototype pollution key detected: "__proto__"')
  })

  it('throws when prototype is passed', () => {
    expect(() => preventPollution('prototype')).toThrow('Prototype pollution key detected: "prototype"')
  })

  it('throws when constructor is passed', () => {
    expect(() => preventPollution('constructor')).toThrow('Prototype pollution key detected: "constructor"')
  })

  it('includes context in error message when provided', () => {
    expect(() => preventPollution('__proto__', 'operation update')).toThrow(
      'Prototype pollution key detected: "__proto__" in operation update',
    )
  })

  it('does not throw for safe keys', () => {
    expect(() => preventPollution('name')).not.toThrow()
    expect(() => preventPollution('id')).not.toThrow()
    expect(() => preventPollution('method')).not.toThrow()
    expect(() => preventPollution('path')).not.toThrow()
    expect(() => preventPollution('data')).not.toThrow()
  })

  it('does not throw for keys that contain dangerous strings as substrings', () => {
    expect(() => preventPollution('myprototype')).not.toThrow()
    expect(() => preventPollution('proto')).not.toThrow()
    expect(() => preventPollution('constructorName')).not.toThrow()
  })

  it('handles empty strings without throwing', () => {
    expect(() => preventPollution('')).not.toThrow()
  })

  it('handles special characters in safe keys', () => {
    expect(() => preventPollution('user-id')).not.toThrow()
    expect(() => preventPollution('user_name')).not.toThrow()
    expect(() => preventPollution('user.email')).not.toThrow()
  })
})
