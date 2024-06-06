import type { Cookie } from '@/entities/workspace/cookie'
import type { Environment } from '@/entities/workspace/environment'
import type { Server } from '@/entities/workspace/server'
import type { Nanoid } from '@/entities/workspace/shared'
import { nanoid } from 'nanoid'

import type { Collection } from './collection'

export type Workspace = {
  uid: string
  name: string
  description: string
  /** List of all request uids in a given workspace */
  requests: Nanoid[]
  /** List of all collections in a given workspace */
  collections: Collection[]
  /** Components */
  environments: Environment[]
  /** Cookies */
  cookies: Cookie[]
  /** Servers */
  servers: Server[]
}

export const defaultWorkspace = (): Workspace => ({
  uid: nanoid(),
  name: 'Default Workspace',
  description: 'Basic Scalar Client Workspace',
  requests: [],
  collections: [],
  environments: [],
  cookies: [],
  servers: [],
})
