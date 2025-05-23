import { bench, describe, expect } from 'vitest'

// import { upgrade as upgradeOld } from './slow/upgrade'
// import { upgradeFromTwoToThree as upgradeFromTwoToThreeOld } from './slow/upgradeFromTwoToThree'
import { upgrade } from './upgrade'
import { upgradeFromTwoToThree } from './upgrade-from-two-to-three'

// Setup the test data
const STRIPE = await fetch(
  'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json',
).then((r) => r.json())

const PETSTORE = await fetch('https://petstore.swagger.io/v2/swagger.json').then((r) => r.json())

describe('upgrade', () => {
  describe('Petstore: Swagger 2.0 to OpenAPI 3.0', () => {
    bench('new', () => {
      expect(PETSTORE.swagger).toBe('2.0')

      const result = upgradeFromTwoToThree({ ...PETSTORE })

      expect(result.openapi).toBe('3.0.4')
    })

    // bench('old', () => {
    //   expect(PETSTORE.swagger).toBe('2.0')

    //   const result = upgradeFromTwoToThreeOld({ ...PETSTORE })

    //   expect(result.openapi).toBe('3.0.4')
    // })
  })

  describe('Stripe: OpenAPI 3.0 to 3.1', () => {
    bench('new', () => {
      expect(STRIPE.openapi).toBe('3.0.0')

      const { specification } = upgrade(JSON.stringify(STRIPE))

      expect(specification?.openapi).toBe('3.1.1')
    })

    // bench('old', () => {
    //   expect(STRIPE.openapi).toBe('3.0.0')

    //   const { specification } = upgradeOld(JSON.stringify(STRIPE))

    //   expect(specification?.openapi).toBe('3.1.1')
    // })
  })

  describe('Petstore: Swagger 2.0 to OpenAPI 3.1', () => {
    bench('new', () => {
      expect(PETSTORE.swagger).toBe('2.0')

      const { specification } = upgrade(JSON.stringify(PETSTORE))

      expect(specification?.openapi).toBe('3.1.1')
    })

    // bench('old', () => {
    //   expect(PETSTORE.swagger).toBe('2.0')

    //   const { specification } = upgradeOld(JSON.stringify(PETSTORE))

    //   expect(specification?.openapi).toBe('3.1.1')
    // })
  })
})
