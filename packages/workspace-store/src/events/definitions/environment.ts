import type { CollectionType } from '@/events/definitions/common'
import type { XScalarEnvVar, XScalarEnvironment } from '@/schemas/extensions/document/x-scalar-environments'

/** Event definitions for all things environment related */
export type EnvironmentEvents = {
  /**
   * Add OR update an environment
   */
  'environment:upsert:environment': {
    environmentName: string
    payload: Partial<XScalarEnvironment>
    /** Only needed when renaming the environment */
    newName?: string
  } & CollectionType
  /**
   * Add OR update an environment variable
   */
  'environment:upsert:environment-variable': {
    environmentName: string
    variableName: string
    payload: Partial<XScalarEnvVar>
  } & CollectionType
  /**
   * Reorder environments
   */
  'environment:update:environment-order': {
    draggingItem: { id: string }
    hoveredItem: { id: string }
  } & CollectionType
  /**
   * Delete an environment
   */
  'environment:delete:environment': { environmentName: string } & CollectionType
  /**
   * Delete an environment variable
   */
  'environment:delete:environment-variable': { environmentName: string; variableName: string } & CollectionType
}
