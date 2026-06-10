import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

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
  /** Order schema properties, defaults to 'preserve' */
  orderSchemaPropertiesBy?: ApiReferenceConfiguration['orderSchemaPropertiesBy']
  /** Order required properties first */
  orderRequiredPropertiesFirst?: ApiReferenceConfiguration['orderRequiredPropertiesFirst']
  /** Expand all nested schema properties by default while keeping the toggle available */
  expandAllSchemaProperties?: ApiReferenceConfiguration['expandAllSchemaProperties']
  /**
   * The document the schema belongs to.
   *
   * Used purely for display, e.g. to resolve discriminator `mapping` references into
   * their component schemas when inferring composition variants.
   */
  document?: OpenApiDocument
}
