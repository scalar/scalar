import { type ThemeId } from '@scalar/themes'
import type { CodeMirrorExtension } from '@scalar/use-codemirror'
import { type ComputedRef, type Ref } from 'vue'

export type SwaggerEditorProps = {
  aiWriterMarkdown?: string
  value?: string
  theme?: ThemeId
  initialTabState?: EditorHeaderTabs
  availableTabs?: EditorHeaderTabs[]
  proxyUrl?: string
  error?: string | Ref<string> | ComputedRef<string> | null
  extensions?: CodeMirrorExtension[]
}

export type SwaggerEditorHeaderProps = {
  activeTab: EditorHeaderTabs
  availableTabs?: EditorHeaderTabs[]
  proxyUrl?: string
}

export type SwaggerEditorInputProps = {
  value?: string
  extensions?: CodeMirrorExtension[]
}

export type EditorHeaderTabs =
  | 'Getting Started'
  | 'Swagger Editor'
  | 'AI Writer'

export type GettingStartedExamples = 'Petstore' | 'CoinMarketCap'

export type OpenSwaggerEditorActions = 'importUrl' | 'uploadFile'
