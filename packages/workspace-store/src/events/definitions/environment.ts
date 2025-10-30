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
    oldEnvironmentName?: string
  } & CollectionType
  /**
   * Add or update an environment variable
   */
  'environment:upsert:environment-variable': {
    environmentName: string
    variable: XScalarEnvVar
    /** Only needed for update, omit it for add */
    index?: number
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
   * Delete an environment variable by index
   */
  'environment:delete:environment-variable': { environmentName: string; index: number } & CollectionType
}
