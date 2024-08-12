import { type ZodSchema, type ZodTypeDef, z } from 'zod'

// ---------------------------------------------------------------------------
// Sidebar items from a github sync config

type ConfigSidebarPage = {
  path: string
  name?: string
  description?: string
  backgroundImage?: string
  icon?: string
  type: 'page'
  children?: ConfigSidebarItem[]
}

const sidebarPageSchema = z.object({
  name: z.string().optional().default(''),
  description: z.string().optional().default(''),
  backgroundImage: z.string().optional(),
  icon: z.string().optional(),
  path: z.string(),
  type: z.literal('page'),
  children: z.lazy(() => sidebarItemSchema.array()).optional(),
}) satisfies ZodSchema<ConfigSidebarPage>

type ConfigSidebarFolder = {
  name: string
  type: 'folder'
  children: ConfigSidebarItem[]
  icon?: string
}

const sidebarFolderSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  type: z.literal('folder'),
  children: z.lazy(() => sidebarItemSchema.array()),
}) satisfies ZodSchema<ConfigSidebarFolder>

type ConfigSidebarLink = {
  name: string
  type: 'link'
  url: string
  icon?: string
}

const sidebarLinkSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  type: z.literal('link'),
  url: z.string(),
}) satisfies ZodSchema<ConfigSidebarLink>

export type ConfigSidebarItem =
  | ConfigSidebarPage
  | ConfigSidebarFolder
  | ConfigSidebarLink

const sidebarItemSchema: ZodSchema<ConfigSidebarItem> = z.union([
  sidebarLinkSchema,
  sidebarPageSchema,
  sidebarFolderSchema,
])

// ---------------------------------------------------------------------------
// Guide/references configs

/**
 * Auto generated guide based on the repository folder structure
 * Links are not supported at this time
 */
export type GuideDirectory = {
  name: string
  description?: string
  /** Root directory for markdown files. Subfolder content will be added to the guide  */
  folder: string
  /** Optional glob patterns for inclusion  */
  include?: string[]
  /** Option glob patterns for exclusion */
  exclude?: string[]
}

/**
 * Explicit specification for the guide sidebar
 * Sidebar entries can include:
 * - markdown files (1:1 with a page)
 * - sidebar folders (has child pages, folders, and links)
 * - links (external links)
 */
export type GuideExplicit = {
  name: string
  description?: string
  sidebar: ConfigSidebarItem[]
}

export type ConfigGuide = GuideDirectory | GuideExplicit

const guideSchema = z.union([
  z.object({
    name: z.string(),
    folder: z.string(),
    include: z.string().array().optional(),
    exclude: z.string().array().optional(),
    description: z.string().default(''),
  }),
  z.object({
    name: z.string(),
    sidebar: sidebarItemSchema.array(),
    description: z.string().default(''),
  }),
]) satisfies ZodSchema<ConfigGuide>

export type ConfigReference = {
  name: string
  path: string
  description?: string
}

const referenceSchema = z.object({
  name: z.string(),
  path: z.string(),
  description: z.string().default(''),
})

/** Top Level Scalar Config Object */
export type ScalarConfig = {
  publishOnMerge?: boolean
  subdomain: string
  customDomain?: string
  siteMeta?: {
    favicon?: string
    ogImage?: string
    title?: string
    description?: string
  }
  siteConfig?: {
    footer?: string
    footerCss?: string
    footerBelowSidebar?: boolean
    headScript?: string
    bodyScript?: string
    theme?: string
    logo?:
      | string
      | {
          darkMode?: string
          lightMode?: string
        }
  }
  guides: ConfigGuide[]
  references: ConfigReference[]
}

const optionalUrl = z.string().url().optional()

export const scalarGitSpecSchema = z.object({
  publishOnMerge: z.boolean().optional(),
  subdomain: z.preprocess((arg) => {
    // Only take the subdomain if the full domain is provided
    return typeof arg === 'string' ? arg.split('.')[0] : arg
  }, z.string().min(3).max(30)),
  customDomain: z.string().min(3).optional(),
  siteMeta: z
    .object({
      favicon: optionalUrl,
      ogImage: optionalUrl,
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .default({}),
  siteConfig: z
    .object({
      theme: z.string().optional(),
      logo: z
        .union([
          optionalUrl,
          z.object({ darkMode: optionalUrl, lightMode: optionalUrl }),
        ])
        .optional(),
      footer: z.string().optional(),
      footerCss: z.string().optional(),
      footerBelowSidebar: z.boolean().optional(),
      headScript: z.string().optional(),
      bodyScript: z.string().optional(),
    })
    .default({}),
  guides: guideSchema.array(),
  references: referenceSchema.array(),
}) satisfies ZodSchema<ScalarConfig, ZodTypeDef, any>
