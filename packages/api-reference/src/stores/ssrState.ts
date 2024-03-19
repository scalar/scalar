import { type SSRState } from 'src/types'

declare global {
  interface Window {
    __SCALAR__: SSRState['scalarState']
  }
}

export const genDefaultSSRstate = (): SSRState['scalarState'] => ({})

/**
 * This is the state object passed in from SSR
 */
export const ssrState: SSRState['scalarState'] = window?.__SCALAR__
  ? window.__SCALAR__ ?? genDefaultSSRstate()
  : genDefaultSSRstate()
