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
