import type { Cookie } from '@/entities/cookie'
import type { Environment } from '@/entities/environment'
import type { Collection, Request, RequestExample, Server, Tag } from '@/entities/spec'
import type { SecurityScheme } from '@scalar/types/entities'
import type { Workspace } from '@/entities/workspace'

export type v_2_5_0 = {
  Cookie: Cookie
  Environment: Environment
  Collection: Collection
  Request: Request
  RequestExample: RequestExample
  SecurityScheme: SecurityScheme
  Server: Server
  Tag: Tag
  Workspace: Workspace

  DataRecord: {
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

  DataArray: {
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
