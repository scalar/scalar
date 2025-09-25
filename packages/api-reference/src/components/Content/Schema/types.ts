import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

/**
 * Options for the schema component tree
 *
 * These options should be prop drilled through the Schema component tree and shouldn't be changed
 */
export type SchemaOptions = {
  /** Hide read-only properties */
  hideReadOnly?: boolean
  /** Hide write-only properties */
  hideWriteOnly?: boolean
  /** Order schema properties, defaults to 'alpha' */
  orderSchemaPropertiesBy?: ApiReferenceConfiguration['orderSchemaPropertiesBy']
  /** Order required properties first */
  orderRequiredPropertiesFirst?: ApiReferenceConfiguration['orderRequiredPropertiesFirst']
}
