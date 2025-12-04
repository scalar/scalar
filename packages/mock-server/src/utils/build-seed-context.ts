import { faker } from '@faker-js/faker'

import { store } from '../libs/store'
import { createStoreWrapper } from './store-wrapper'

/**
 * Seed helper function type.
 */
type SeedHelper = {
  /**
   * Create n items using a factory function.
   */
  count: (n: number, factory: () => any) => any[]
  /**
   * Create items from an array of objects.
   */
  (items: any[]): any[]
  /**
   * Create a single item using a factory function (shorthand for count(1, factory)).
   */
  (factory: () => any): any
}

/**
 * Context object provided to x-seed code.
 */
export type SeedContext = {
  store: ReturnType<typeof createStoreWrapper>['wrappedStore']
  faker: typeof faker
  seed: SeedHelper
  schema: string
}

/**
 * Build the seed context with a seed helper function.
 * The seed helper automatically uses the schema key as the collection name.
 */
export function buildSeedContext(schemaKey: string): SeedContext {
  const { wrappedStore } = createStoreWrapper(store)

  /**
   * Seed helper function that provides a Laravel-inspired API.
   */
  const seedHelper = ((arg1: number | any[] | (() => any), arg2?: () => any) => {
    // Case 1: seed.count(n, factory)
    if (typeof arg1 === 'number' && typeof arg2 === 'function') {
      const count = arg1
      const factory = arg2
      const items: any[] = []

      for (let i = 0; i < count; i++) {
        const item = factory()
        const created = wrappedStore.create(schemaKey, item)
        items.push(created)
      }

      return items
    }

    // Case 2: seed(array)
    if (Array.isArray(arg1)) {
      const items: any[] = []

      for (const item of arg1) {
        const created = wrappedStore.create(schemaKey, item)
        items.push(created)
      }

      return items
    }

    // Case 3: seed(factory) - single item
    if (typeof arg1 === 'function') {
      const factory = arg1
      const item = factory()
      const created = wrappedStore.create(schemaKey, item)
      return created
    }

    throw new Error('Invalid seed() usage. Use seed.count(n, factory), seed(array), or seed(factory)')
  }) as SeedHelper

  // Add count method to the function
  seedHelper.count = (n: number, factory: () => any) => {
    const items: any[] = []

    for (let i = 0; i < n; i++) {
      const item = factory()
      const created = wrappedStore.create(schemaKey, item)
      items.push(created)
    }

    return items
  }

  return {
    store: wrappedStore,
    faker,
    seed: seedHelper,
    schema: schemaKey,
  }
}
