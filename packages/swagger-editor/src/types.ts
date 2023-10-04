import { type ThemeId } from '@scalar/themes'

export type SwaggerEditorProps = {
  value?: string
  hocuspocusConfiguration?: HocuspocusConfigurationProp
  theme?: ThemeId
  initialTabState?: EditorHeaderTabs
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

export type EditorHeaderTabs = 'Getting Started' | 'Swagger Editor'

export type GettingStartedExamples = 'Petstore' | 'Tableau' | 'CoinMarketCap'
