import { nanoidSchema, timestampSchema } from '@/utility'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

export type PublishRecord = {
  uid: string
  projectUid: string
  createdAt: number
  updatedAt: number
  status: 'pending' | 'building' | 'deployed' | 'inactive' | 'error' | 'deleted'
  message: string
  domain: string
}

export const publishRecordSchema = z.object({
  uid: nanoidSchema,
  projectUid: nanoidSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  status: z.union([
    z.literal('pending'),
    z.literal('building'),
    z.literal('deployed'),
    z.literal('inactive'),
    z.literal('error'),
    z.literal('deleted'),
  ]),
  message: z.string().default(''),
  domain: z.string().default(''),
}) satisfies ZodSchema<PublishRecord, ZodTypeDef, any>
