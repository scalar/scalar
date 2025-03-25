import { z } from 'zod'
import { PathItemObjectSchema } from './path-item-object'

export const WebhooksObjectSchema = z.record(z.string(), PathItemObjectSchema)
