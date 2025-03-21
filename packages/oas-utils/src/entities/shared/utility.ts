import type { ENTITY_BRANDS } from '@scalar/types/utils'
import { z } from 'zod'

/** Schema for selectedSecuritySchemeUids */
export const selectedSecuritySchemeUidSchema = z
  .union([
    z.string().brand<ENTITY_BRANDS['SECURITY_SCHEME']>(),
    z.string().brand<ENTITY_BRANDS['SECURITY_SCHEME']>().array(),
  ])
  .array()
  .default([])

export type SelectedSecuritySchemeUids = z.infer<typeof selectedSecuritySchemeUidSchema>
