import { z } from 'zod'

/** UID format for objects */
export type Nanoid = string

export const nanoidSchema = z.string().min(7)
