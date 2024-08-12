import {
  type Project,
  type Version,
  projectSchema,
  versionSchema,
} from '@/project'
import { type Theme, themeSchema } from '@/theme'
import { nanoidSchema } from '@/utility'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

export * from './scalar-config'

export type HeadingRecord = {
  slug: string
  name: string
  level: number
  uid: string
  parent?: string
}

export const headingRecordSchema = z.object({
  slug: z.string(),
  name: z.string(),
  level: z.coerce.number().int(),
  uid: nanoidSchema,
  parent: z.string().optional(),
}) satisfies ZodSchema<HeadingRecord, ZodTypeDef, any>

/** Documentation payload for typesense */
export type TypesenseDocumentationInput = {
  project_uid: string
  version_uid: string
  guide_uid: string
  page_uid: string
  company: string
  page_title: string
  page_content: string
  type: string
}

export const typesenseDocumentationFields: {
  name: string
  type: 'string'
}[] = [
  { name: 'project_uid', type: 'string' },
  { name: 'version_uid', type: 'string' },
  { name: 'guide_uid', type: 'string' },
  { name: 'page_uid', type: 'string' },
  { name: 'company', type: 'string' },
  { name: 'page_title', type: 'string' },
  { name: 'page_content', type: 'string' },
  { name: 'type', type: 'string' },
]

/** All static content required to generate a page */
export type StaticContent = {
  html: string
  headings: Record<string, HeadingRecord>
  markdown: string
}

const renderedPageDataSchema = z.record(
  z.string(),
  z.object({
    html: z.string(),
    headings: z.record(z.string(), headingRecordSchema),
    markdown: z.string(),
  }),
) satisfies ZodSchema<Record<string, StaticContent | null>>

// ---------------------------------------------------------------------------

export type PublishData = {
  project: Project
  versions: Version[]
  yjsDocs: Record<string, string>
  yjsReferences: Record<string, string>
  theme: Theme | null
  typesenseKey?: string
  staticDocs: Partial<Record<string, StaticContent>>
  isPaid?: boolean
}

/** Save format for publish data */
export const publishJsonDataSchema = z
  .object({
    project: projectSchema,
    versions: versionSchema.array(),
    yjsDocs: z.record(z.string(), z.string()),
    yjsReferences: z.record(z.string(), z.string()),
    theme: themeSchema.nullable(),
    typesenseKey: z.string().optional(),
    staticDocs: renderedPageDataSchema.default({}),
    isPaid: z.boolean().optional().default(false),
  })
  .superRefine((arg, ctx) => {
    Object.keys(arg.yjsDocs).forEach((k) => {
      if (arg.yjsDocs[k] && !arg.staticDocs[k]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['staticDocs'],
          message: `Missing the rendered content for yjsDoc ${k}`,
        })
      }
    })

    return arg
  }) satisfies ZodSchema<PublishData, ZodTypeDef, any>

// ---------------------------------------------------------------------------

/** Request from core to publish-deploy for a publish */
export const publishDeployRequestSchema = z.object({
  token: z.string(),
  teamUid: nanoidSchema,
  publishUid: nanoidSchema,
  subdomain: z.string(),
  yjsDocs: z.record(z.string(), z.string()),
  yjsReferences: z.record(z.string(), z.string()),
  project: projectSchema,
  versions: versionSchema.array(),
  theme: themeSchema.nullable(),
  customDomain: z.string().nullable(),
  isPaid: z.boolean().optional(),
})

/** Data package required for a github sync publish */
export type PublishGithubData = {
  token: string
  publishUid: string
  teamUid: string
  subdomain: string
  customDomain?: string | null
  documents: Record<string, string>
  references: Record<string, string>
  project: Project
  version: Version
  theme: Theme | null
  isPaid: boolean
}

/** Request from core to publish-deploy for github sync publish */
export const publishGithubRequestSchema = z.object({
  token: z.string(),
  teamUid: nanoidSchema,
  publishUid: nanoidSchema,
  subdomain: z.string(),
  customDomain: z.string().optional().default(''),
  documents: z.record(z.string(), z.string()),
  references: z.record(z.string(), z.string()),
  project: projectSchema,
  version: versionSchema,
  theme: themeSchema.nullable(),
  isPaid: z.boolean().default(false),
}) satisfies ZodSchema<PublishGithubData, ZodTypeDef, any>
