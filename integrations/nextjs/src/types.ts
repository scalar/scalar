import type { HtmlRenderingConfiguration } from '@scalar/client-side-rendering'

/** Configuration serialized into the browser's API reference. Do not include server secrets. */
export type ApiReferenceConfiguration = HtmlRenderingConfiguration

/** Resolve browser configuration separately for every incoming request. */
export type ApiReferenceConfigurationFactory = (
  request: Request,
) => Partial<ApiReferenceConfiguration> | Promise<Partial<ApiReferenceConfiguration>>

/** HTTP response options. The HTML content type is always set by the handler. */
export type ApiReferenceOptions = {
  /** Additional response headers, such as Cache-Control or Content-Security-Policy. */
  headers?: HeadersInit
}
