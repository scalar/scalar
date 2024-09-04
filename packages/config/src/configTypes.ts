import { type Static, Type } from '@sinclair/typebox'

export const ConfigSidebarLinkType = Type.Recursive(
  (This) =>
    Type.Object({
      name: Type.String(),
      type: Type.Literal('link'),
      url: Type.String(),
      icon: Type.Optional(Type.String()),
      children: Type.Optional(
        Type.Array(Type.Union([This])), // TODO: fix this
      ),
    }),
  { $id: 'ConfigSidebarLinkType' },
)

export type ConfigSidebarLink = Static<typeof ConfigSidebarLinkType>

export const ConfigSidebarPageType = Type.Recursive(
  (This) =>
    Type.Object({
      path: Type.String(),
      name: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
      backgroundImage: Type.Optional(Type.String()),
      icon: Type.Optional(Type.String()),
      type: Type.Literal('page'),
      children: Type.Optional(
        Type.Array(Type.Union([This, ConfigSidebarLinkType])), // TODO: fix this so a folder can be a child of a page
      ),
    }),
  { $id: 'ConfigSidebarPageType' },
)

export type ConfigSidebarPage = Static<typeof ConfigSidebarPageType>

export const ConfigSidebarFolderType = Type.Recursive(
  (This) =>
    Type.Object({
      name: Type.String(),
      type: Type.Literal('folder'),
      children: Type.Optional(
        Type.Array(
          Type.Union([This, ConfigSidebarPageType, ConfigSidebarLinkType]),
        ),
      ),
      icon: Type.Optional(Type.String()),
    }),
  { $id: 'ConfigSidebarFolderType' },
)

export type ConfigSidebarFolder = Static<typeof ConfigSidebarFolderType>

export const ConfigGuideType = Type.Union([
  Type.Object({
    name: Type.String(),
    description: Type.Optional(Type.String()),
    folder: Type.String(),
  }),
  Type.Object({
    name: Type.String(),
    description: Type.Optional(Type.String()),
    sidebar: Type.Array(
      Type.Union([
        ConfigSidebarPageType,
        ConfigSidebarFolderType,
        ConfigSidebarLinkType,
      ]),
    ),
  }),
])

export type ConfigGuide = Static<typeof ConfigGuideType>

export const ConfigReferenceType = Type.Object({
  name: Type.String(),
  path: Type.String(),
  description: Type.Optional(Type.String()),
})

export type ConfigReference = Static<typeof ConfigReferenceType>

export const ScalarConfigType = Type.Object({
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
  guides: Type.Array(ConfigGuideType),
  references: Type.Array(ConfigReferenceType),
})

export type ScalarConfig = Static<typeof ScalarConfigType>
