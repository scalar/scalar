import type { HarRequest } from '@scalar/snippetz/types'
import type { ThemeId } from '@scalar/themes'
import type {
  ContentType,
  ReferenceConfiguration,
  Spec,
} from '@scalar/types/legacy'
import type { Slot } from 'vue'

export type { ReferenceConfiguration }

export type ReferenceProps = {
  configuration?: ReferenceConfiguration
}

export type ReferenceLayoutProps = {
  configuration: ReferenceConfiguration
  parsedSpec: Spec
  rawSpec: string
  isDark: boolean
}

export type PathRouting = {
  basePath: string
}

export type GettingStartedExamples = 'Petstore' | 'CoinMarketCap'

export type Parameter = {
  name: string
  required: boolean
  displayType: string
  description: string
}

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

export type Content = {
  [key in ContentType]: ContentSchema
}

export type Contact = {
  email: string
}

export type License = {
  name: string
  url: string
}

export type Info = {
  title: string
  description?: string
  termsOfService?: string
  contact?: Contact
  license?: License
  version?: string
}

export type HarRequestWithPath = HarRequest & {
  path: string
}

export type ReferenceLayoutType = 'modern' | 'classic'

/** Slots required for standalone reference components */
export type ReferenceSlot = 'footer'

export type ReferenceSlots = {
  // None of our slots should have any slot props
  [x in ReferenceSlot]: Slot<Record<string, never>>
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

export type ReferenceSlotProps = {
  spec: Spec
  breadcrumb: string
}

export type ReferenceLayoutEvents = {
  (e: 'changeTheme', value: ThemeId): void
  (e: 'updateContent', value: string): void
  (e: 'loadSwaggerFile'): void
  (e: 'linkSwaggerFile'): void
  (e: 'toggleDarkMode'): void
}
