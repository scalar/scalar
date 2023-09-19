export type SwaggerEditorProps = {
  value?: string
  hocuspocusConfiguration?: HocuspocusConfigurationProp
}

export type SwaggerEditorInputProps = {
  hocuspocusConfiguration?: HocuspocusConfigurationProp
}

export type HocuspocusConfigurationProp = {
  url: string
  name: string
  token?: string
  username?: string
}
