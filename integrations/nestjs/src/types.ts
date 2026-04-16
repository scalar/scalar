import type { HtmlRenderingConfiguration } from '@scalar/client-side-rendering'

export type ApiReferenceOptions = Partial<HtmlRenderingConfiguration>

export type NestJSReferenceConfiguration = ApiReferenceOptions & {
  withFastify?: boolean
}
