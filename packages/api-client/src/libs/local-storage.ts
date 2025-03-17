import type { WorkspaceStore } from '@/store'
import { cookieSchema } from '@scalar/oas-utils/entities/cookie'
import { environmentSchema } from '@scalar/oas-utils/entities/environment'
import {
  collectionSchema,
  requestExampleSchema,
  requestSchema,
  securitySchemeSchema,
  serverSchema,
  tagSchema,
} from '@scalar/oas-utils/entities/spec'
import { workspaceSchema } from '@scalar/oas-utils/entities/workspace'
import { schemaModel } from '@scalar/oas-utils/helpers'
import { DATA_VERSION, DATA_VERSION_LS_LEY, migrator } from '@scalar/oas-utils/migrations'
import type { ZodSchema, ZodTypeDef } from 'zod'

/** Loads the migrated resource into the mutator safely */
const loadResources = <T extends (object & { uid: string })[]>(
  resources: T,
  schema: ZodSchema<T[number], ZodTypeDef, any>,
  add: (payload: T[number]) => void | T[number],
) =>
  resources.forEach((payload) => {
    // Use schema model for safe parsing
    const resource = schemaModel(payload, schema, false)

    // Success, a failure should log a warning in the console already through the schema model
    if (resource) {
      add(resource)
    }
  })

/**
 * Loads all resources from localStorage and applies any migrations, then loads into mutators
 * We use the raw mutator.add here instead of the custom ones because we do NOT want any side effects
 *
 * Currently not working for workspace
 */
export const loadAllResources = (mutators: WorkspaceStore) => {
  const {
    collectionMutators,
    cookieMutators,
    environmentMutators,
    tagMutators,
    requestExampleMutators,
    requestMutators,
    serverMutators,
    securitySchemeMutators,
    workspaceMutators,
  } = mutators

  try {
    // Hit our local storage data migrator
    const {
      collections,
      cookies,
      environments,
      requestExamples,
      requests,
      servers,
      securitySchemes,
      tags,
      workspaces,
    } = migrator()

    // Load the migrated data up into the mutators with safe parsing
    // TODO: we should probably make rawAdd -> add, and add a new name for adding with side effects
    loadResources(collections, collectionSchema, collectionMutators.rawAdd)
    loadResources(cookies, cookieSchema, cookieMutators.add)
    loadResources(environments, environmentSchema, environmentMutators.add)
    loadResources(requestExamples, requestExampleSchema, requestExampleMutators.rawAdd)
    loadResources(requests, requestSchema, requestMutators.rawAdd)
    loadResources(servers, serverSchema, serverMutators.rawAdd)
    loadResources(securitySchemes, securitySchemeSchema, securitySchemeMutators.rawAdd)
    loadResources(tags, tagSchema, tagMutators.rawAdd)
    loadResources(workspaces, workspaceSchema, workspaceMutators.rawAdd)

    // Set localStorage version for future migrations
    localStorage.setItem(DATA_VERSION_LS_LEY, DATA_VERSION)
  } catch (e) {
    console.error(e)
  }
}
