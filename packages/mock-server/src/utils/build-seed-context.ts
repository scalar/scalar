import { store } from '../libs/store'
import { createStoreWrapper } from './store-wrapper'

/**
 * Context object provided to x-seed code.
 *
 * The `seed` helper itself lives inside the sandbox (see `sandbox.ts`); it
 * persists generated items through this store using the schema key as the
 * collection name.
 */
export type SeedContext = {
  store: ReturnType<typeof createStoreWrapper>['wrappedStore']
  schema: string
}

/**
 * Build the seed context for a schema.
 */
export function buildSeedContext(schemaKey: string): SeedContext {
  const { wrappedStore } = createStoreWrapper(store)

  return {
    store: wrappedStore,
    schema: schemaKey,
  }
}
