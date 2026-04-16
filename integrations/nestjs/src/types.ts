import type { HtmlRenderingConfiguration } from '@scalar/types/api-reference'

export type ApiReferenceOptions = Partial<HtmlRenderingConfiguration>

export type NestJSReferenceConfiguration = ApiReferenceOptions & {
  withFastify?: boolean
}
