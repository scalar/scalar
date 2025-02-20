import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Collection, Request, RequestExample, SecurityScheme, Server, Tag } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import type { Mutators } from '@scalar/object-utils/mutator-record'

export type StoreContext = {
  collections: Record<Collection['uid'], Collection>
  collectionMutators: Mutators<Collection>
  //
  tags: Record<Tag['uid'], Tag>
  tagMutators: Mutators<Tag>
  //
  requests: Record<Request['uid'], Request>
  requestMutators: Mutators<Request>
  //
  requestExamples: Record<RequestExample['uid'], RequestExample>
  requestExampleMutators: Mutators<RequestExample>
  //
  cookies: Record<Cookie['uid'], Cookie>
  cookieMutators: Mutators<Cookie>
  //
  environments: Record<Environment['uid'], Environment>
  environmentMutators: Mutators<Environment>
  //
  servers: Record<Server['uid'], Server>
  serverMutators: Mutators<Server>
  //
  securitySchemes: Record<SecurityScheme['uid'], SecurityScheme>
  securitySchemeMutators: Mutators<SecurityScheme>
  //
  workspaces: Record<Workspace['uid'], Workspace>
  workspaceMutators: Mutators<Workspace>
}

export type AllEntityRecords = Pick<
  StoreContext,
  | 'collections'
  | 'tags'
  | 'requests'
  | 'requestExamples'
  | 'cookies'
  | 'environments'
  | 'servers'
  | 'securitySchemes'
  | 'workspaces'
>
