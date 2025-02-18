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

export type v_2_5_0 = {
  Cookie: Ck
  Environment: E
  Collection: Co
  Request: R
  RequestExample: RE
  SecurityScheme: SS
  Server: S
  Tag: T
  Workspace: W

  DataRecord: {
    collections: Record<string, Co>
    cookies: Record<string, Ck>
    environments: Record<string, E>
    requestExamples: Record<string, RE>
    requests: Record<string, R>
    securitySchemes: Record<string, SS>
    servers: Record<string, S>
    tags: Record<string, T>
    workspaces: Record<string, W>
  }

  DataArray: {
    collections: Co[]
    cookies: Ck[]
    environments: E[]
    requestExamples: RE[]
    requests: R[]
    securitySchemes: SS[]
    servers: S[]
    tags: T[]
    workspaces: W[]
  }
}
