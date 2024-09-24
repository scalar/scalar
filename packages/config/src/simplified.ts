import { type Static, Type } from '@sinclair/typebox'

export const LinkType = Type.Object({
  type: Type.Literal('link'),
  url: Type.String(),
})

export type Link = Static<typeof LinkType>

export const PageType = Type.Object({
  path: Type.String(),
  type: Type.Literal('page'),
})

export type Page = Static<typeof PageType>

export const FolderType = Type.Object({
  type: Type.Literal('folder'),
})

export type Folder = Static<typeof FolderType>

const SidebarType = Type.Union([PageType, LinkType, FolderType])

export const SidebarItemType = Type.Recursive(
  (This) =>
    Type.Composite([
      SidebarType,
      Type.Object({
        children: Type.Optional(Type.Array(This)),
      }),
    ]),
  { $id: 'SidebarItemType' },
)
