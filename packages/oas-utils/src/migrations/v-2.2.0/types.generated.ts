import type { Cookie as Ck } from '@/entities/cookie'
import type { Environment as E } from '@/entities/environment'
import type {
  Collection as Co,
  Request as R,
  RequestExample as RE,
  Server as S,
  SecurityScheme as SS,
  Tag as T,
} from '@/entities/spec'

/**
 * The most current types are not generated
 */
export namespace v_2_2_0 {
  export type Cookie = Ck
  export type Environment = E
  export type Collection = Co
  export type Request = R
  export type RequestExample = RE
  export type SecurityScheme = SS
  export type Server = S
  export type Tag = T

  export type Workspace = {
    uid: string
    name: string
    description: string
    isReadOnly: boolean
    collections: string[]
    environments: string[]
    hotKeyConfig?:
      | {
          modifiers: ('Meta' | 'Control' | 'Shift' | 'Alt' | 'default')[]
          hotKeys?:
            | {
                [x: string]: {
                  modifiers?:
                    | ('Meta' | 'Control' | 'Shift' | 'Alt' | 'default')[]
                    | undefined
                  event:
                    | 'closeModal'
                    | 'navigateSearchResultsDown'
                    | 'selectSearchResult'
                    | 'navigateSearchResultsUp'
                    | 'openCommandPalette'
                    | 'createNew'
                    | 'toggleSidebar'
                    | 'addTopNav'
                    | 'closeTopNav'
                    | 'navigateTopNavLeft'
                    | 'navigateTopNavRight'
                    | 'focusAddressBar'
                    | 'jumpToTab'
                    | 'jumpToLastTab'
                    | 'focusRequestSearch'
                }
              }
            | undefined
        }
      | undefined
    activeEnvironmentId: string
    cookies: string[]
    proxyUrl?: string | undefined
    themeId:
      | 'alternate'
      | 'default'
      | 'moon'
      | 'purple'
      | 'solarized'
      | 'bluePlanet'
      | 'deepSpace'
      | 'saturn'
      | 'kepler'
      | 'mars'
      | 'none'
  }

  export type DataRecord = {
    collections: Record<string, Collection>
    cookies: Record<string, Cookie>
    environments: Record<string, Environment>
    requestExamples: Record<string, RequestExample>
    requests: Record<string, Request>
    securitySchemes: Record<string, SecurityScheme>
    servers: Record<string, Server>
    tags: Record<string, Tag>
    workspaces: Record<string, Workspace>
  }

  export type DataArray = {
    collections: Collection[]
    cookies: Cookie[]
    environments: Environment[]
    requestExamples: RequestExample[]
    requests: Request[]
    securitySchemes: SecurityScheme[]
    servers: Server[]
    tags: Tag[]
    workspaces: Workspace[]
  }
}
