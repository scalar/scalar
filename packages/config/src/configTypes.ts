import { Type, type Static } from '@sinclair/typebox'

export const ConfigSidebarLinkSchema = Type.Object({
  name: Type.String(),
  type: Type.Literal('link'),
  url: Type.String(),
  icon: Type.Optional(Type.String()),
})

export type ConfigSidebarLink = Static<typeof ConfigSidebarLinkSchema>

export const ConfigSidebarPageSchema = Type.Object({
  path: Type.String(),
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  backgroundImage: Type.Optional(Type.String()),
  icon: Type.Optional(Type.String()),
  type: Type.Literal('page'),
})

export type ConfigSidebarPage = Static<typeof ConfigSidebarPageSchema>

export const ConfigSidebarFolderSchema = Type.Object({
  name: Type.String(),
  type: Type.Literal('folder'),
  icon: Type.Optional(Type.String()),
})

export type ConfigSidebarFolder = Static<typeof ConfigSidebarFolderSchema>

export const SidebarItemSchema = Type.Recursive(
  (This) =>
    Type.Composite([
      Type.Union([ConfigSidebarPageSchema, ConfigSidebarFolderSchema, ConfigSidebarLinkSchema]),
      Type.Object({
        children: Type.Optional(Type.Array(This)),
      }),
    ]),
  { $id: 'SidebarItemType' },
)

export type SidebarItem = Static<typeof SidebarItemSchema>

export const ConfigGuideDirectorySchema = Type.Object({
  name: Type.String(),
  description: Type.Optional(Type.String()),
  folder: Type.String(),
})

export const ConfigGuideExplicitSchema = Type.Object({
  name: Type.String(),
  description: Type.Optional(Type.String()),
  sidebar: Type.Array(SidebarItemSchema),
})

// TODO: Currently only using the explicit guide schema
export const ConfigGuideSchema = Type.Union([ConfigGuideDirectorySchema, ConfigGuideExplicitSchema])

export type ConfigGuide = Static<typeof ConfigGuideSchema>

export const ConfigReferenceSchema = Type.Object({
  name: Type.String(),
  path: Type.String(),
  description: Type.Optional(Type.String()),
})

export type ConfigReference = Static<typeof ConfigReferenceSchema>

export const ScalarConfigSchema = Type.Object({
  publishOnMerge: Type.Optional(Type.Boolean()),
  subdomain: Type.String(),
  customDomain: Type.Optional(Type.String()),
  siteMeta: Type.Optional(
    Type.Object({
      favicon: Type.Optional(Type.String()),
      ogImage: Type.Optional(Type.String()),
      title: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
    }),
  ),
  siteConfig: Type.Optional(
    Type.Object({
      footer: Type.Optional(Type.String()),
      footerCss: Type.Optional(Type.String()),
      footerBelowSidebar: Type.Optional(Type.Boolean()),
      headScript: Type.Optional(Type.String()),
      bodyScript: Type.Optional(Type.String()),
      theme: Type.Optional(Type.String()),
      logo: Type.Optional(
        Type.Union([
          Type.String(),
          Type.Object({
            darkMode: Type.Optional(Type.String()),
            lightMode: Type.Optional(Type.String()),
          }),
        ]),
      ),
    }),
  ),
  guides: Type.Array(ConfigGuideExplicitSchema), // TODO: include directory type
  references: Type.Array(ConfigReferenceSchema),
})

export type ScalarConfig = Static<typeof ScalarConfigSchema>

export const sidebarSchemaMap = {
  page: ConfigSidebarPageSchema,
  folder: ConfigSidebarFolderSchema,
  link: ConfigSidebarLinkSchema,
}
