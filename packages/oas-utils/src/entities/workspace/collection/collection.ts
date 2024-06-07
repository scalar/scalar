import type { Server } from '@/entities/workspace/server'
import type { Nanoid } from '@/entities/workspace/shared'
import { nanoid } from 'nanoid'
import type { OpenAPIV3_1 } from 'openapi-types'

/**
 * A collection must be able to map 1:1 with an OAS 3.1 spec file
 *
 * Collections will have two modes of display:
 * - Standard: Ordered by tag similar to ApiReference Sidebar
 * - Folder: Ordered into arbitrary folders. See x-scalar-folder.yaml
 */
export type Collection = {
  uid: Nanoid
  /** Additional Open API spec fields that can be edited */
  spec: {
    openapi: string | '3.1.0' | '4.0.0'
    info?: OpenAPIV3_1.InfoObject
    servers: Server[]
    tags: OpenAPIV3_1.TagObject[]
    externalDocs?: OpenAPIV3_1.ExternalDocumentationObject
  }
  /**
   * List of request uids from the workspace to be assigned to a given collection/spec-file
   * WARNING: While a workspace may contain multiple requests with the same path and method only
   */
  requests: Nanoid[]
  /** The currently selected server */
  selectedServerUid: string
  /** All folders in a collection */
  folders: Record<Nanoid, CollectionFolder>
  /**  List of uids that correspond to collection requests or folders */
  children: string[]
}

/** Create a new collection object */
export const defaultCollection = ({
  title,
  version,
  description,
}: {
  title: string
  version?: string
  description?: string
}): Collection => ({
  uid: nanoid(),
  spec: {
    openapi: '3.1.0',
    info: {
      title,
      description,
      version: version ?? '0.0.1',
    },
    servers: [],
    tags: [],
  },
  selectedServerUid: '',
  requests: [],
  folders: {},
  children: [],
})

/** Folders will correspond to the x- */
export type CollectionFolder = {
  /** Used for database sync only */
  uid: Nanoid
  /** Will correspond to the slash separate path some, some/nested or some/nested/folder */
  name: string
  /** Folder descriptions */
  description?: string
  /**
   * List of uids that correspond to requests or folders
   * WARNING: while uids are used we must check that corresponding $refs are not duplicated
   */
  children: string[]
}

/** New collection folder instance */
export const defaultCollectionFolder = (info: {
  name: string
  description?: string
  children?: string[]
}): CollectionFolder => ({
  uid: nanoid(),
  ...info,
  children: info.children ?? [],
})
