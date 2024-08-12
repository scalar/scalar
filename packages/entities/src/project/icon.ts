import { timestampSchema } from '@/utility'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

/**
 * Project Icon Definition
 *
 * Contains the information required to list an icon for user selection
 */
export type ProjectIconDefinition = {
  /** Key to local icon OR URL to hosted icon */
  src: string
  /** Image alt or svg title */
  title?: string
  /** Mask a non-svg image */
  mask?: boolean
  /** Search and group tags */
  tags: string[]
  /** Sorting group in list */
  group: 'solid' | 'line' | 'brand' | 'custom'
}

/**
 * Simplified Icon Definition
 *
 * Contains the information required to **render** a user selected icon
 */
export type ProjectIconInfo = Pick<
  ProjectIconDefinition,
  'src' | 'title' | 'mask'
>

/**
 * Custom User Uploaded Icon Definition
 *
 * A superset of the normal icon definition that also contains
 * the information about a user uploaded icon
 */
export type CustomProjectIconDefinition = ProjectIconDefinition & {
  /** Timestamp for when the icon was uploaded */
  createdAt: number
  /** User ID who uploaded the icon */
  uploadedBy: string
  /** Always a custom icon */
  group: 'custom'
}

const baseIconSchema = z.object({
  src: z.string().default(''),
  title: z.string().optional(),
  mask: z.boolean().optional(),
})

export const projectIconSchema = z.preprocess((arg: any) => {
  if (!arg) return arg

  if (!arg.src) arg.src = arg.local || arg.remote
  if (arg.local) arg.group = 'solid'
  if (arg.remote) arg.group = 'custom'

  return arg
}, baseIconSchema) satisfies ZodSchema<ProjectIconInfo, ZodTypeDef, any>

export const customProjectIconSchema = baseIconSchema.extend({
  tags: z.array(z.string()).default([]),
  createdAt: timestampSchema,
  uploadedBy: z.string(),
  group: z.literal('custom'),
}) satisfies ZodSchema<CustomProjectIconDefinition, ZodTypeDef, any>
