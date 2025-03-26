import { z } from 'zod'
import { PathItemObjectSchema } from './path-item-object'

// TODO: Comment
export const WebhooksObjectSchema = z.record(z.string(), PathItemObjectSchema)
