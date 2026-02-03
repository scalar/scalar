import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { SecurityScheme } from '@scalar/types/entities'
import z from 'zod'

export const registryApiMetadata = z.object({
  id: z.string(),
  title: z.string(),
  namespace: z.string(),
  currentVersion: z.string(),
  logoUrl: z.url().nullable(),
  slug: z.string(),
})

export type ApiMetadata = z.infer<typeof registryApiMetadata> & { removable?: boolean; searchEnabled?: boolean }

export type RegistryDocument = { namespace: string; slug: string }

export type DocumentSettings = Record<
  string,
  {
    securitySchemes: SecurityScheme[]
    activeServer: OpenAPIV3_1.ServerObject | undefined
  }
>
