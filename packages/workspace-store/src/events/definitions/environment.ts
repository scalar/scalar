import type { CollectionType } from '@/events/definitions/common'
import type { XScalarEnvVar, XScalarEnvironment } from '@/schemas/extensions/document/x-scalar-environments'

/** Event definitions for all things environment related */
export type EnvironmentEvents = {
  /**
   * Add OR update an environment
   */
  'upsert:environment': {
    environmentName: string
    payload: Partial<XScalarEnvironment>
  } & CollectionType
  /**
   * Add OR update an environment variable
   */
  'upsert:environment-variable': {
    environmentName: string
    variableName: string
    payload: Partial<XScalarEnvVar>
  } & CollectionType
  /**
   * Reorder environments
   */
  'update:environment-order': {
    draggingItem: { id: string }
    hoveredItem: { id: string }
  } & CollectionType
  /**
   * Delete an environment
   */
  'delete:environment': { environmentName: string } & CollectionType
  /**
   * Delete an environment variable
   */
  'delete:environment-variable': { environmentName: string; variableName: string } & CollectionType
}
