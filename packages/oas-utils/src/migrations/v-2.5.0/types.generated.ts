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
import type { Workspace as W } from '@/entities/workspace'

export namespace v_2_5_0 {
  export type Cookie = Ck
  export type Environment = E
  export type Collection = Co
  export type Request = R
  export type RequestExample = RE
  export type SecurityScheme = SS
  export type Server = S
  export type Tag = T
  export type Workspace = W

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
