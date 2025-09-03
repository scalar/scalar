import type { HtmlRenderingConfiguration } from '@scalar/core/libs/html-rendering'

export type ApiReferenceOptions = Partial<HtmlRenderingConfiguration>

export type NestJSReferenceConfiguration = ApiReferenceOptions & {
  withFastify?: boolean
}
