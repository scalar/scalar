import type { Cookie } from '@/entities/cookie/cookie.ts'
import type { Environment } from '@/entities/environment/environment.ts'
import type { Collection } from '@/entities/spec/collection.ts'
import type { RequestExample } from '@/entities/spec/request-examples.ts'
import type { Request } from '@/entities/spec/requests.ts'
import type { Server } from '@/entities/spec/server.ts'
import type { Tag } from '@/entities/spec/spec-objects.ts'
import type { Workspace } from '@/entities/workspace/workspace.ts'
import type { SecurityScheme } from '@scalar/types/entities'

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
