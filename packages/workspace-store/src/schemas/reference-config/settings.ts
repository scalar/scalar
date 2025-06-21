import { Type, type Static } from '@sinclair/typebox'

export const SettingsSchema = Type.Partial(
  Type.Object({
    proxyUrl: Type.String(),
    searchKey: Type.String(),
  }),
)

export type Settings = Static<typeof SettingsSchema>

export const defaultSettings: Required<Settings> = {
  proxyUrl: 'https://proxy.scalar.com',
  searchKey: 'k',
}
