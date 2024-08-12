import { nanoidSchema, timestampSchema, unixTimestamp } from '@/utility'
import { nanoid } from 'nanoid'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

export * from './guide'
export * from './reference'
export * from './version'
export * from './publish'
export * from './icon'
export * from './github'
export * from './signup'

export type Logo = {
  darkMode: string
  lightMode: string
}

export const logoSchema: ZodSchema<Logo> = z.object({
  darkMode: z.string(),
  lightMode: z.string(),
})

// ---------------------------------------------------------------------------

export type Website = {
  lastDeployed: number
  subdomainPrefix: string
  customUrl: string
  title?: string
  description?: string
  favicon?: string
  ogImage?: string
}

export const websiteSchema: ZodSchema<Website, ZodTypeDef, any> = z.preprocess(
  (arg: any) => {
    if (arg && !arg?.subdomainPrefix)
      arg.subdomainPrefix = arg?.subdomainUrl || ''

    return arg
  },
  z.object({
    lastDeployed: timestampSchema,
    subdomainPrefix: z.string().transform((val) => val.toLowerCase()),
    customUrl: z.string().transform((val) => val.toLowerCase()),
    title: z.string().optional(),
    description: z.string().optional(),
    favicon: z.string().optional(),
    ogImage: z.string().optional(),
  }),
)

export function defaultWebsite() {
  return websiteSchema.parse({
    lastDeployed: 0,
    subdomainPrefix: '',
    customUrl: '',
    title: '',
    description: '',
    favicon: '',
    ogImage: '',
  })
}

// ---------------------------------------------------------------------------

export type Project = {
  uid: string
  name: string
  activeTemplateId: string
  activeThemeId: string
  activeVersionId: string
  createdAt: number
  updatedAt: number
  logo: Logo
  website: Website
  typesenseId?: number
}

export const projectSchema = z.object({
  uid: nanoidSchema,
  name: z.string(),
  activeTemplateId: z.string().optional().default(''),
  activeThemeId: z.string().optional().default(''),
  activeVersionId: z.string().optional().default(''),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  logo: logoSchema,
  website: websiteSchema,
  typesenseId: z.number().optional(),
}) satisfies ZodSchema<Project, ZodTypeDef, any>

export function defaultProject(
  name?: string,
  activeVersionId?: string,
): Project {
  return projectSchema.parse({
    uid: nanoid(),
    name: name ?? '',
    activeTemplateId: '',
    activeThemeId: '',
    activeVersionId,
    createdAt: unixTimestamp(),
    updatedAt: unixTimestamp(),
    header: [],
    logo: {
      darkMode: '',
      lightMode: '',
    },
    website: defaultWebsite(),
  })
}
