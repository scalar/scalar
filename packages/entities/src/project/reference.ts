import { nanoidSchema } from '@/utility'
import { nanoid } from 'nanoid'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

export type Reference = {
  uid: string
  title: string
  description: string
  specPermalink?: string
  yjsReference: string
  /** Whether to publish the reference or not */
  show: boolean
  /** Option to show the header link as a button */
  isButton: boolean
  /** Option to force the header link to the topbar */
  isStarred: boolean
}

export const referenceSchema: ZodSchema<Reference, ZodTypeDef, any> =
  z.preprocess(
    (arg: any) => {
      if (arg.title === '') arg.title = 'Reference'

      return arg
    },
    z.object({
      uid: nanoidSchema,
      title: z.string(),
      description: z.string(),
      yjsReference: nanoidSchema,
      specPermalink: z.string().optional().default(''),
      show: z.boolean().default(true),
      isButton: z.boolean().default(false),
      isStarred: z.boolean().default(false),
    }),
  )

export function defaultReference() {
  return referenceSchema.parse({
    uid: nanoid(),
    title: '',
    description: '',
    yjsReference: nanoid(),
  })
}
