import type { Cookie } from '@/entities/workspace/cookie'
import type { Environment } from '@/entities/workspace/environment'
import { nanoid } from 'nanoid'

export type Workspace = {
  uid: string
  name: string
  description: string
  /** List of all collection uids in a given workspace */
  collections: string[]
  /** Environments */
  environments: Environment[]
  /** Cookies */
  cookies: Cookie[]
}

export const defaultWorkspace = (): Workspace => ({
  uid: nanoid(),
  name: 'Default Workspace',
  description: 'Basic Scalar Client Workspace',
  collections: [],
  environments: [],
  cookies: [],
})
