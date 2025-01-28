import { nanoid } from 'nanoid'
import { z } from 'zod'

/** Generates a default value */
export const nanoidSchema = z
  .string()
  .min(7)
  .optional()
  .default(() => nanoid())

/** UID format for objects */
export type Nanoid = z.infer<typeof nanoidSchema>

/** Schema for selectedSecuritySchemeUids */
export const selectedSecuritySchemeUidSchema = z
  .union([nanoidSchema, nanoidSchema.array()])
  .array()
  .default([])

export type SelectedSecuritySchemeUids = z.infer<
  typeof selectedSecuritySchemeUidSchema
>
