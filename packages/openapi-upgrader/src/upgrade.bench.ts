import { PETSTORE_URL_2_0, STRIPE_URL_3_0 } from '@scalar/helpers/url/oas-document-fixtures'
import { describe, expect, it } from 'vitest'

import { upgradeFromTwoToThree } from './2.0-to-3.0/upgrade-from-two-to-three'
// import { upgrade as upgradeOld } from './slow/upgrade'
// import { upgradeFromTwoToThree as upgradeFromTwoToThreeOld } from './slow/upgradeFromTwoToThree'
import { upgrade } from './upgrade'

// Setup the test data
const STRIPE = await fetch(STRIPE_URL_3_0).then((r) => r.json())

const PETSTORE = await fetch(PETSTORE_URL_2_0).then((r) => r.json())

describe('upgrade', () => {
  describe('Petstore: Swagger 2.0 to OpenAPI 3.0', () => {
    it('new', async ({ bench }) => {
      const fixture = { document: structuredClone(PETSTORE) }
      await bench(
        'new',
        {
          beforeEach: () => {
            fixture.document = structuredClone(PETSTORE)
          },
        },
        () => {
          expect(PETSTORE.swagger).toBe('2.0')

          const result = upgradeFromTwoToThree(fixture.document)

          expect(result.openapi).toBe('3.0.4')
        },
      ).run()
    })

    // bench('old', () => {
    //   expect(PETSTORE.swagger).toBe('2.0')

    //   const result = upgradeFromTwoToThreeOld({ ...PETSTORE })

    //   expect(result.openapi).toBe('3.0.4')
    // })
  })

  describe('Stripe: OpenAPI 3.0 to 3.1', () => {
    it('new', async ({ bench }) => {
      const fixture = { document: structuredClone(STRIPE) }
      await bench(
        'new',
        {
          beforeEach: () => {
            fixture.document = structuredClone(STRIPE)
          },
        },
        () => {
          expect(STRIPE.openapi).toBe('3.0.0')

          const document = upgrade(fixture.document, '3.1')

          expect(document?.openapi).toBe('3.1.1')
        },
      ).run()
    })

    // bench('old', () => {
    //   expect(STRIPE.openapi).toBe('3.0.0')

    //   const document = upgradeOld(STRIPE)

    //   expect(document?.openapi).toBe('3.1.1')
    // })
  })

  describe('Petstore: Swagger 2.0 to OpenAPI 3.1', () => {
    it('new', async ({ bench }) => {
      const fixture = { document: structuredClone(PETSTORE) }
      await bench(
        'new',
        {
          beforeEach: () => {
            fixture.document = structuredClone(PETSTORE)
          },
        },
        () => {
          expect(PETSTORE.swagger).toBe('2.0')

          const document = upgrade(fixture.document, '3.1')

          expect(document?.openapi).toBe('3.1.1')
        },
      ).run()
    })

    // bench('old', () => {
    //   expect(PETSTORE.swagger).toBe('2.0')

    //   const document = upgradeOld(PETSTORE)

    //   expect(document?.openapi).toBe('3.1.1')
    // })
  })
})
