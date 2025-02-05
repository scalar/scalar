import type { Cookie as Ck } from '@/entities/cookie'
import type { Environment as E } from '@/entities/environment'
import type {
  Collection as Co,
  RequestExample as RE,
  Server as S,
  SecurityScheme as SS,
  Tag as T,
} from '@/entities/spec'
import type { Workspace as W } from '@/entities/workspace'

export namespace v_2_6_0 {
  export type Cookie = Ck
  export type Environment = E
  export type Collection = Co
  export type RequestExample = RE
  export type SecurityScheme = SS
  export type Server = S
  export type Tag = T
  export type Workspace = W

  export type Request = {
    tags?: string[] | undefined
    summary?: string | undefined
    description?: string | undefined
    operationId?: string | undefined
    security?:
      | {
          [x: string]: string[]
        }[]
      | undefined
    requestBody?: any | undefined
    parameters?:
      | {
          in: 'path' | 'query' | 'header' | 'cookie'
          name: string
          description?: string | undefined
          required: boolean
          deprecated: boolean
          schema?: unknown | undefined
          content?: unknown | undefined
          style?:
            | (
                | 'matrix'
                | 'simple'
                | 'form'
                | 'label'
                | 'spaceDelimited'
                | 'pipeDelimited'
                | 'deepObject'
              )
            | undefined
          example?: unknown | undefined
          examples?:
            | {
                [x: string]: {
                  value?: unknown
                  summary?: string | undefined
                }
              }
            | undefined
        }[]
      | undefined
    externalDocs?:
      | {
          description?: string | undefined
          url: string
        }
      | undefined
    deprecated?: boolean | undefined
    responses?:
      | {
          [x: string]: any
        }
      | undefined
    type: 'request'
    uid: string
    path: string
    method:
      | 'connect'
      | 'delete'
      | 'get'
      | 'head'
      | 'options'
      | 'patch'
      | 'post'
      | 'put'
      | 'trace'
    servers: string[]
    selectedServerUid: string
    examples: string[]
    selectedSecuritySchemeUids: (string | string[])[]
    selectedExampleUid: string
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
