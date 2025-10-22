import { Type } from '@scalar/typebox'
import type { RequiredDeep } from 'type-fest'

import { ServerObjectSchema } from '@/schemas/v3.1/strict/openapi-document'
import type { ServerObject } from '@/schemas/v3.1/strict/server'

export const SettingsSchema = Type.Partial(
  Type.Object({
    proxyUrl: Type.String(),
    searchKey: Type.String(),
    /** Array of server configurations */
    servers: Type.Array(ServerObjectSchema),
    /** Base server URL for API requests */
    baseServerUrl: Type.String(),
  }),
)

export type Settings = {
  proxyUrl?: string
  searchKey?: string
  servers?: ServerObject[]
  baseServerUrl?: string
}

export const defaultSettings: RequiredDeep<Settings> = {
  proxyUrl: '',
  searchKey: 'k',
  servers: [],
  baseServerUrl: '',
}
