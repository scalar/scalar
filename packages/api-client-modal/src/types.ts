import type { SpecConfiguration } from '@scalar/oas-utils'
import type { RequestMethod } from '@scalar/oas-utils/helpers'

/** Configuration options for the Scalar API client */
export type ClientConfiguration = {
  /** The Swagger/OpenAPI spec to render */
  spec: SpecConfiguration
  /** Pass in a proxy to the API client */
  proxyUrl?: string
  /** Whether to show the sidebar */
  showSidebar?: boolean
  /** Whether dark mode is on or off initially (light mode) */
  // darkMode?: boolean
  /** Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
  searchHotKey?:
    | 'a'
    | 'b'
    | 'c'
    | 'd'
    | 'e'
    | 'f'
    | 'g'
    | 'h'
    | 'i'
    | 'j'
    | 'k'
    | 'l'
    | 'm'
    | 'n'
    | 'o'
    | 'p'
    | 'q'
    | 'r'
    | 's'
    | 't'
    | 'u'
    | 'v'
    | 'w'
    | 'x'
    | 'y'
    | 'z'
}

export type OpenClientPayload = { path: string; method: RequestMethod }
