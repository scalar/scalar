import { Type } from '@scalar/typebox'
import type { ServerObject } from '@scalar/types/openapi/3.1'
import type { RequiredDeep } from 'type-fest'

const ServerObjectSchema = Type.Object({
  url: Type.String(),
  description: Type.Optional(Type.String()),
  variables: Type.Optional(Type.Record(Type.String(), Type.Object({}))),
})

export const SettingsSchema = Type.Partial(
  Type.Object({
    /** Custom proxy configuration */
    proxyUrl: Type.String(),
    /** Hotkey used to open the search menu */
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
