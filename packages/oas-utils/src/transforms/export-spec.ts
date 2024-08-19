import {
  type Collection,
  type Request,
  oasRequestSchema,
} from '@/entities/spec'
import { schemaModel } from '@/helpers'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export function exportSpecFromWorkspace({
  collection,
  requests,
}: {
  collection: Collection
  requests: Record<string, Request>
}) {
  return collection
}
