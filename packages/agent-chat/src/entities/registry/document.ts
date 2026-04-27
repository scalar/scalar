import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { SecurityScheme } from '@scalar/types/entities'
import { nullable, object, string, union, type Static } from '@scalar/validation'

export const registryApiMetadata = object({
  id: string(),
  title: string(),
  namespace: string(),
  currentVersion: string(),
  logoUrl: union([string(), nullable()]),
  slug: string(),
})

export type ApiMetadata = Static<typeof registryApiMetadata> & { removable?: boolean; searchEnabled?: boolean }

export type RegistryDocument = { namespace: string; slug: string }

export type DocumentSettings = Record<
  string,
  {
    securitySchemes: SecurityScheme[]
    activeServer: OpenAPIV3_1.ServerObject | undefined
  }
>
