import type { SpecConfiguration } from '@scalar/oas-utils'

/** Configuration options for the Scalar API client */
export type ClientConfiguration = {
  /** The Swagger/OpenAPI spec to render */
  spec: SpecConfiguration
  /** Enables the scalar proxy for the API client */
  useProxy?: boolean
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
