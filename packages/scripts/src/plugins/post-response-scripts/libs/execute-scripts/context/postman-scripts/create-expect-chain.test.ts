import { describe, expect, it } from 'vitest'
import { createExpectChain } from './create-expect-chain'

describe('createExpectChain', () => {
  describe('to.be.below', () => {
    it('passes when number is below expected', () => {
      const chain = createExpectChain(5)
      expect(chain.to.be.below(10)).toBe(true)
    })

    it('throws when number is equal to expected', () => {
      const chain = createExpectChain(10)
      expect(() => chain.to.be.below(10)).toThrow('Expected 10 to be below 10')
    })

    it('throws when number is greater than expected', () => {
      const chain = createExpectChain(15)
      expect(() => chain.to.be.below(10)).toThrow('Expected 15 to be below 10')
    })

    it('throws when value is not a number', () => {
      const chain = createExpectChain('not a number')
      expect(() => chain.to.be.below(10)).toThrow('Expected value to be a number')
    })
  })

  describe('to.be.an', () => {
    it('correctly identifies arrays', () => {
      const chain = createExpectChain([1, 2, 3])
      expect(chain.to.be.an('array')).toBe(true)
    })

    it('throws when type does not match', () => {
      const chain = createExpectChain('string')
      expect(() => chain.to.be.an('array')).toThrow('Expected "string" to be an array, but got string')
    })
  })

  describe('to.be.oneOf', () => {
    it('passes when value is in expected array', () => {
      const chain = createExpectChain('apple')
      expect(chain.to.be.oneOf(['apple', 'banana', 'orange'])).toBe(true)
    })

    it('throws when value is not in expected array', () => {
      const chain = createExpectChain('grape')
      expect(() => chain.to.be.oneOf(['apple', 'banana', 'orange'])).toThrow(
        'Expected "grape" to be one of ["apple","banana","orange"]',
      )
    })

    it('throws when expected is not an array', () => {
      const chain = createExpectChain('apple')
      expect(() => chain.to.be.oneOf('not an array' as any)).toThrow('Expected argument to be an array')
    })
  })

  describe('to.include', () => {
    it('passes when string includes expected substring', () => {
      const chain = createExpectChain('hello world')
      expect(chain.to.include('world')).toBe(true)
    })

    it('throws when string does not include expected substring', () => {
      const chain = createExpectChain('hello world')
      expect(() => chain.to.include('goodbye')).toThrow('Expected "hello world" to include "goodbye"')
    })

    it('throws when value is not a string', () => {
      const chain = createExpectChain(123)
      expect(() => chain.to.include('23')).toThrow('Expected value to be a string')
    })
  })

  it('throws when trying to expect a Promise', () => {
    expect(() => createExpectChain(Promise.resolve())).toThrow(
      'Expected value cannot be a Promise. Make sure to await async values before using expect.',
    )
  })

  describe('to.equal', () => {
    it('passes when values are strictly equal', () => {
      const chain = createExpectChain(42)
      expect(chain.to.equal(42)).toBe(true)
    })

    it('throws when values are not equal', () => {
      const chain = createExpectChain(42)
      expect(() => chain.to.equal(43)).toThrow('Expected 42 to equal 43')
    })

    it('distinguishes between different types', () => {
      const chain = createExpectChain('42')
      expect(() => chain.to.equal(42)).toThrow('Expected "42" to equal 42')
    })
  })

  describe('to.deep.equal', () => {
    it('passes when objects are deeply equal', () => {
      const chain = createExpectChain({ a: 1, b: { c: 2 } })
      expect(chain.to.deep.equal({ a: 1, b: { c: 2 } })).toBe(true)
    })

    it('throws when objects are not deeply equal', () => {
      const chain = createExpectChain({ a: 1, b: { c: 2 } })
      expect(() => chain.to.deep.equal({ a: 1, b: { c: 3 } })).toThrow(
        'Expected {"a":1,"b":{"c":2}} to deeply equal {"a":1,"b":{"c":3}}',
      )
    })
  })

  describe('to.match', () => {
    it('passes when string matches regex pattern', () => {
      const chain = createExpectChain('hello123')
      expect(chain.to.match(/^[a-z]+\d+$/)).toBe(true)
    })

    it('throws when string does not match pattern', () => {
      const chain = createExpectChain('hello123')
      expect(() => chain.to.match(/^\d+$/)).toThrow('Expected "hello123" to match /^\\d+$/')
    })

    it('throws when value is not a string', () => {
      const chain = createExpectChain(123)
      expect(() => chain.to.match(/\d+/)).toThrow('Expected value to be a string')
    })
  })

  describe('to.have.length', () => {
    it('passes when array has expected length', () => {
      const chain = createExpectChain([1, 2, 3])
      expect(chain.to.have.length(3)).toBe(true)
    })

    it('passes when string has expected length', () => {
      const chain = createExpectChain('hello')
      expect(chain.to.have.length(5)).toBe(true)
    })

    it('throws when length does not match', () => {
      const chain = createExpectChain([1, 2, 3])
      expect(() => chain.to.have.length(4)).toThrow('Expected [1,2,3] to have length 4 but got 3')
    })

    it('throws when value has no length property', () => {
      const chain = createExpectChain(42)
      expect(() => chain.to.have.length(2)).toThrow('Expected value to have a length property')
    })
  })

  describe('to.exist', () => {
    it('passes when value exists', () => {
      const chain = createExpectChain({})
      expect(chain.to.exist()).toBe(true)
    })

    it('throws when value is null', () => {
      const chain = createExpectChain(null)
      expect(() => chain.to.exist()).toThrow('Expected value to exist but got null')
    })

    it('throws when value is undefined', () => {
      const chain = createExpectChain(undefined)
      expect(() => chain.to.exist()).toThrow('Expected value to exist but got undefined')
    })
  })

  describe('to.be.null', () => {
    it('passes when value is null', () => {
      const chain = createExpectChain(null)
      expect(chain.to.be.null()).toBe(true)
    })

    it('throws when value is not null', () => {
      const chain = createExpectChain({})
      expect(() => chain.to.be.null()).toThrow('Expected value to be null')
    })
  })

  describe('to.be.undefined', () => {
    it('passes when value is undefined', () => {
      const chain = createExpectChain(undefined)
      expect(chain.to.be.undefined()).toBe(true)
    })

    it('throws when value is not undefined', () => {
      const chain = createExpectChain(null)
      expect(() => chain.to.be.undefined()).toThrow('Expected value to be undefined')
    })
  })

  describe('to.be.empty', () => {
    it('passes when array is empty', () => {
      const chain = createExpectChain([])
      expect(chain.to.be.empty()).toBe(true)
    })

    it('passes when string is empty', () => {
      const chain = createExpectChain('')
      expect(chain.to.be.empty()).toBe(true)
    })

    it('passes when object has no keys', () => {
      const chain = createExpectChain({})
      expect(chain.to.be.empty()).toBe(true)
    })

    it('throws when array is not empty', () => {
      const chain = createExpectChain([1])
      expect(() => chain.to.be.empty()).toThrow('Expected array to be empty')
    })
  })

  describe('to.be.true/false', () => {
    it('passes when value is true', () => {
      const chain = createExpectChain(true)
      expect(chain.to.be.true()).toBe(true)
    })

    it('passes when value is false', () => {
      const chain = createExpectChain(false)
      expect(chain.to.be.false()).toBe(true)
    })

    it('throws when checking true on non-true value', () => {
      const chain = createExpectChain(1)
      expect(() => chain.to.be.true()).toThrow('Expected value to be true')
    })
  })

  describe('to.be.above', () => {
    it('passes when number is above expected', () => {
      const chain = createExpectChain(15)
      expect(chain.to.be.above(10)).toBe(true)
    })

    it('throws when number is equal to expected', () => {
      const chain = createExpectChain(10)
      expect(() => chain.to.be.above(10)).toThrow('Expected 10 to be above 10')
    })

    it('throws when number is below expected', () => {
      const chain = createExpectChain(5)
      expect(() => chain.to.be.above(10)).toThrow('Expected 5 to be above 10')
    })
  })

  describe('to.be.at.least', () => {
    it('passes when number is greater than expected', () => {
      const chain = createExpectChain(15)
      expect(chain.to.be.at.least(10)).toBe(true)
    })

    it('passes when number is equal to expected', () => {
      const chain = createExpectChain(10)
      expect(chain.to.be.at.least(10)).toBe(true)
    })

    it('throws when number is less than expected', () => {
      const chain = createExpectChain(5)
      expect(() => chain.to.be.at.least(10)).toThrow('Expected 5 to be at least 10')
    })
  })

  describe('to.have.property', () => {
    it('passes when object has property', () => {
      const chain = createExpectChain({ a: 1 })
      expect(chain.to.have.property('a')).toBe(true)
    })

    it('passes when object has property with specific value', () => {
      const chain = createExpectChain({ a: 1 })
      expect(chain.to.have.property('a', 1)).toBe(true)
    })

    it('throws when property does not exist', () => {
      const chain = createExpectChain({})
      expect(() => chain.to.have.property('a')).toThrow('Expected object to have property "a"')
    })

    it('throws when property value does not match', () => {
      const chain = createExpectChain({ a: 1 })
      expect(() => chain.to.have.property('a', 2)).toThrow('Expected property "a" to equal 2 but got 1')
    })
  })

  describe('to.have.keys', () => {
    it('passes when object has all specified keys', () => {
      const chain = createExpectChain({ a: 1, b: 2 })
      expect(chain.to.have.keys(['a', 'b'])).toBe(true)
    })

    it('throws when object is missing keys', () => {
      const chain = createExpectChain({ a: 1 })
      expect(() => chain.to.have.keys(['a', 'b', 'c'])).toThrow('Expected object to have keys: b, c')
    })
  })

  describe('not', () => {
    it('inverts equal assertion', () => {
      const chain = createExpectChain(1)
      expect(chain.not.to.equal(2)).toBe(true)
    })

    it('throws when negated assertion would pass', () => {
      const chain = createExpectChain(1)
      expect(() => chain.not.to.equal(1)).toThrow('Expected 1 to not equal 1')
    })
  })

  describe('to.eql', () => {
    it('passes when objects are deeply equal', () => {
      const chain = createExpectChain({ a: 1, b: { c: 2 } })
      expect(chain.to.eql({ a: 1, b: { c: 2 } })).toBe(true)
    })

    it('throws when objects are not deeply equal', () => {
      const chain = createExpectChain({ a: 1, b: { c: 2 } })
      expect(() => chain.to.eql({ a: 1, b: { c: 3 } })).toThrow(
        'Expected {"a":1,"b":{"c":2}} to deeply equal {"a":1,"b":{"c":3}}',
      )
    })

    it('handles arrays correctly', () => {
      const chain = createExpectChain([1, { a: 2 }])
      expect(chain.to.eql([1, { a: 2 }])).toBe(true)
    })
  })
})
