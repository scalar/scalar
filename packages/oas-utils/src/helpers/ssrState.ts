import type { ScalarState } from '@scalar/types/legacy'

declare global {
  interface Window {
    __SCALAR__: ScalarState
  }
}

export const defaultStateFactory = (): ScalarState => ({})

/**
 * This allows us to access the server state in the front-end
 */
export const ssrState: ScalarState =
  typeof window !== 'undefined' ? (window.__SCALAR__ ?? defaultStateFactory()) : defaultStateFactory()
