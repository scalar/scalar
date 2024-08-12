import { type ProjectIconInfo, projectIconSchema } from '@/project/icon'
import { nanoidSchema } from '@/utility'
import { nanoid } from 'nanoid'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

// ---------------------------------------------------------------------------
// Sidebar Types

export type Children = string[]

export enum SidebarType {
  Page = 'Page',
  Folder = 'Folder',
  Link = 'Link',
}

type BaseSidebarItem = {
  uid: string
  title: string
  type: SidebarType
  link?: string
  icon?: ProjectIconInfo
  children?: Children
  description?: string
  show: boolean
}

const baseSidebarItemSchema = z.object({
  uid: nanoidSchema,
  title: z.string().trim().min(1),
  type: z.nativeEnum(SidebarType),
  link: z.string().optional(),
  icon: projectIconSchema.optional(),
  children: z.string().array().optional(),
  description: z.string().optional(),
  show: z.boolean(),
}) satisfies ZodSchema<BaseSidebarItem, ZodTypeDef, any>

export type Link = BaseSidebarItem & { link: string; type: SidebarType.Link }
export type Folder = BaseSidebarItem & {
  /** Ordered ist of item ids that are the children of this element */
  children: Children
  type: SidebarType.Folder
}
export type Page = BaseSidebarItem & {
  description: string
  /** Ordered ist of item ids that are the children of this element */
  children: Children
  type: SidebarType.Page
  yjsReference: string
  backgroundImage?: string
}

const linkSchema = baseSidebarItemSchema.extend({
  title: z.preprocess(
    (arg) => (arg as string)?.trim() || 'Link',
    z.string().trim().min(1),
  ),
  link: z.string(),
  type: z.literal(SidebarType.Link),
}) satisfies ZodSchema<Link, ZodTypeDef, any>

const pageSchema = baseSidebarItemSchema.extend({
  title: z.preprocess(
    (arg) => (arg as string)?.trim() || 'Page',
    z.string().trim().min(1),
  ),
  description: z.string(),
  children: z.string().array().default([]),
  type: z.literal(SidebarType.Page),
  yjsReference: z.string(),
  backgroundImage: z.string().optional(),
  icon: projectIconSchema.optional(),
}) satisfies ZodSchema<Page, ZodTypeDef, any>

const folderSchema = baseSidebarItemSchema.extend({
  title: z.preprocess(
    (arg) => (arg as string)?.trim() || 'Folder',
    z.string().trim().min(1),
  ),
  children: z.string().array().default([]),
  type: z.literal(SidebarType.Folder),
}) satisfies ZodSchema<Folder, ZodTypeDef, any>

export type SidebarItem = Link | Page | Folder

export const sidebarItemSchema = z.union([
  linkSchema,
  pageSchema,
  folderSchema,
]) satisfies ZodSchema<SidebarItem, ZodTypeDef, any>

export type Sidebar = {
  /** Complete record of ALL sidebar items */
  items: Partial<Record<string, SidebarItem>>
  /** Ordered list of the direct children */
  children: string[]
}

export const sidebarSchema = z.object({
  items: z.record(z.string(), sidebarItemSchema),
  children: z.string().array(),
}) satisfies ZodSchema<Sidebar, ZodTypeDef, any>

// ---------------------------------------------------------------------------
// Guide Types

export type Guide = {
  uid: string
  title: string
  description: string
  sidebar: Sidebar
  /** Whether to publish the guide or not */
  show: boolean
  /** Option to show the header link as a button */
  isButton: boolean
  /** Option to force the header link to the topbar */
  isStarred: boolean
}

export const guideSchema: ZodSchema<Guide, ZodTypeDef, any> = z.preprocess(
  (arg: any) => {
    if (arg.title.trim() === '') arg.title = 'Guide'
    return arg
  },
  z.object({
    uid: nanoidSchema,
    title: z.string().min(1, 'Guide title must be at least 1 character'),
    description: z.string(),
    sidebar: sidebarSchema,
    show: z.boolean().default(true),
    isButton: z.boolean().default(false),
    isStarred: z.boolean().default(false),
  }),
)

export const defaultPage = (): Page => ({
  uid: nanoid(),
  title: 'Getting Started',
  type: SidebarType.Page,
  description: 'Start writing your API Documentation with our platform',
  children: [],
  show: true,
  yjsReference: nanoid(),
})

export function defaultGuide() {
  const firstPage = defaultPage()

  return guideSchema.parse({
    uid: nanoid(),
    title: '',
    description: '',
    sidebar: {
      items: {
        [firstPage.uid]: firstPage,
      },
      children: [firstPage.uid],
    },
    show: true,
    isButton: false,
    isStarred: false,
  })
}
