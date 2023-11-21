import { type ThemeId } from '@scalar/themes'
import { type ComputedRef, type Ref } from 'vue'

export type SwaggerEditorProps = {
  aiWriterMarkdown?: string
  value?: string
  hocuspocusConfiguration?: HocuspocusConfigurationProp
  theme?: ThemeId
  initialTabState?: EditorHeaderTabs
  availableTabs?: EditorHeaderTabs[]
  proxyUrl?: string
  error?: string | Ref<string> | ComputedRef<string> | null
}

export type SwaggerEditorHeaderProps = {
  activeTab: EditorHeaderTabs
  availableTabs?: EditorHeaderTabs[]
  proxyUrl?: string
}

export type SwaggerEditorInputProps = {
  value?: string
  hocuspocusConfiguration?: HocuspocusConfigurationProp
}

export type HocuspocusConfigurationProp = {
  url: string
  name: string
  token?: string
  username?: string
}

export type EditorHeaderTabs =
  | 'Getting Started'
  | 'Swagger Editor'
  | 'AI Writer'

export type GettingStartedExamples = 'Petstore' | 'Tableau' | 'CoinMarketCap'

export type OpenSwaggerEditorActions = 'importUrl' | 'uploadFile'
