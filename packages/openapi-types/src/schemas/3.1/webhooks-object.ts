import { z } from 'zod'
import { PathItemObjectSchema } from '.'

export const WebhooksObjectSchema = z.record(z.string(), PathItemObjectSchema)
