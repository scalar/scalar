import { type ThemeId } from '@scalar/themes'
import type { CodeMirrorExtension } from '@scalar/use-codemirror'
import { type ComputedRef, type Ref } from 'vue'

export type SwaggerEditorProps = {
  value?: string
  theme?: ThemeId
  proxyUrl?: string
  error?: string | Ref<string> | ComputedRef<string> | null
}

export type SwaggerEditorHeaderProps = {
  proxyUrl?: string
}

export type SwaggerEditorInputProps = {
  value?: string
  extensions?: CodeMirrorExtension[]
}

export type OpenSwaggerEditorActions = 'importUrl' | 'uploadFile'
