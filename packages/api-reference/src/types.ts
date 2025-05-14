import type { AnyApiReferenceConfiguration, ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { Spec } from '@scalar/types/legacy'

export type { ApiReferenceConfiguration }

export type ReferenceProps = {
  configuration?: AnyApiReferenceConfiguration
}

/**
 * Before the configuration is parsed, we can use the broader types.
 */
export type ReferenceLayoutProps = {
  configuration: Partial<ApiReferenceConfiguration>
  parsedSpec: Spec
  rawSpec: string
  isDark: boolean
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
