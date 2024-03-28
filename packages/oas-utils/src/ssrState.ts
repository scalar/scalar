import { type SSRState } from './types'

declare global {
  interface Window {
    __SCALAR__: SSRState['scalarState']
  }
}

export const defaultStateFactory = (): SSRState['scalarState'] => ({})

/**
 * This allows us to access the server state in the front-end
 */
export const ssrState: SSRState['scalarState'] = window?.__SCALAR__
  ? window.__SCALAR__ ?? defaultStateFactory()
  : defaultStateFactory()
