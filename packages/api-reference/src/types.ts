import type { AnyApiReferenceConfiguration, ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { OpenAPIV3_1 } from '@scalar/types/legacy'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

export type { ApiReferenceConfiguration }

export type ReferenceProps = {
  configuration?: AnyApiReferenceConfiguration
}

/**
 * Before the configuration is parsed, we can use the broader types.
 */
export type ReferenceLayoutProps = {
  configuration: Partial<ApiReferenceConfiguration>
  /**
   *
   * The OpenAPI 3.1 document, but all $ref's are resolved already.
   *
   * @remark You need to add the `originalDocument`, too.
   *
   * @example
   *
   * import { upgrade, dereference } from '@scalar/openapi-parser'
   *
   * const { specification: upgradedDocument } = upgrade(originalDocument)
   * const { schema: dereferencedDocument } = await dereference(upgradedDocument)
   */
  dereferencedDocument?: OpenAPIV3_1.Document
  /**
   * The raw OpenAPI document. Doesn't have to be OpenAPI 3.1.
   */
  originalDocument?: string
  isDark: boolean
  /**
   * @deprecated Use `originalDocument` instead.
   */
  rawSpec?: string
  /**
   * @deprecated this is just temporary until we switch to the new store, we prop drill it down
   */
  store: WorkspaceStore
}

export type GettingStartedExamples = 'Petstore' | 'CoinMarketCap'

export type ContentProperties = {
  [key: string]: {
    type: string
    format?: string
    example?: any
    required?: string[]
    enum?: string[]
    description?: string
    properties?: ContentProperties
  }
}

export type ContentSchema = {
  schema?: {
    type: string
    required?: string[]
    properties: ContentProperties
  }
}
/** Slots required for reference base / layout component */
export type ReferenceLayoutSlot =
  | 'header'
  | 'footer'
  | 'editor'
  | 'content-start'
  | 'content-end'
  | 'sidebar-start'
  | 'sidebar-end'

export type ReferenceLayoutSlots = {
  [x in ReferenceLayoutSlot]: (props: ReferenceSlotProps) => any
}

export type DocumentSelectorSlot = {
  'document-selector': any
}

export type ReferenceSlotProps = {
  breadcrumb: string
}
