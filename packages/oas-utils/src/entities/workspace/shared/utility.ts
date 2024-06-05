import { nanoid } from 'nanoid'
import { z } from 'zod'

export const nanoidSchema = z.string().min(7).default(nanoid())

/** UID format for objects */
export type Nanoid = z.infer<typeof nanoidSchema>
