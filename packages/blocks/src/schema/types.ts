import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Component } from 'vue'

import type { SchemaExpansionStore } from './helpers/schema-expansion'

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
  /** Expand all nested schema properties by default while keeping the toggle available */
  expandAllSchemaProperties?: ApiReferenceConfiguration['expandAllSchemaProperties']
  /** Arrow-key navigation over the row toggles */
  schemaKeyboardNav?: ApiReferenceConfiguration['schemaKeyboardNav']
  /**
   * Whether the models section is hidden.
   *
   * Model names stay visible, but there is no models section to scroll to, so they
   * render as plain text instead of links.
   */
  hideModels?: ApiReferenceConfiguration['hideModels']
  /**
   * The document the schema belongs to.
   *
   * Used purely for display, e.g. to resolve discriminator `mapping` references into
   * their component schemas when inferring composition variants.
   */
  document?: OpenApiDocument
}

/** Host integrations passed explicitly through schema rows and their parents. */
export type SchemaRenderingProps = {
  /** Active deep-link target; only disclosures on its path open automatically. */
  scrollTargetId?: string
  /** Renderer for the host's registered specification extensions. */
  specificationExtension?: Component
  /** One expansion store shared by the host's schema trees, headers, and callbacks. */
  expansion?: SchemaExpansionStore
}
