import type { AnyApiReferenceConfiguration, ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { OpenAPIV3_1, Spec } from '@scalar/types/legacy'

export type { ApiReferenceConfiguration }

export type ReferenceProps = {
  configuration?: AnyApiReferenceConfiguration
}

/**
 * Before the configuration is parsed, we can use the broader types.
 */
export type ReferenceLayoutProps = {
  configuration: Partial<ApiReferenceConfiguration>
  // TODO: Don’t make these optional.
  /**
   *
   * The OpenAPI 3.1 document, but all $ref’s are resolved already.
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
   * The original document. Doesn’t have to be OpenAPI 3.1.
   */
  originalDocument?: string
  isDark: boolean
  /**
   * @deprecated We can’t use this anymore. Use `dereferencedDocument` instead.
   */
  parsedSpec?: Spec
  /**
   * @deprecated Use `originalDocument` instead.
   */
  rawSpec?: string
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
  spec: Spec
  breadcrumb: string
}
