import { type ZodSchema, z } from 'zod'

export type TagObject = {
  name: string
  /** Optional CommonMark Description */
  description?: string
  externalDocs?: object
}

export const tagObjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
}) satisfies ZodSchema<TagObject>
