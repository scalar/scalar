import { ServerObjectSchema } from '@/schemas/v3.1/strict/openapi-document'
import { Type, type Static } from '@scalar/typebox'
import type { RequiredDeep } from 'type-fest'

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

export type Settings = Static<typeof SettingsSchema>

export const defaultSettings: RequiredDeep<Settings> = {
  proxyUrl: 'https://proxy.scalar.com',
  searchKey: 'k',
  servers: [],
  baseServerUrl: '',
}
