import { nanoidSchema, timestampSchema } from '@/utility'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

export type RetryAction = {
  uid: string
  type: 'delete-image'
  data?: any
  user: string
  createdAt: number
  updatedAt: number
}

export const retryActionSchema: ZodSchema<RetryAction, ZodTypeDef, any> =
  z.object({
    uid: nanoidSchema,
    type: z.literal('delete-image'),
    data: z.any().optional(),
    user: nanoidSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
