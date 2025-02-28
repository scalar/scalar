import type { HtmlRenderingOptions } from '@scalar/api-reference/lib/html-rendering'
import type { ApiReferenceConfiguration as ScalarApiReferenceConfiguration } from '@scalar/types/api-reference'

/**
 * The configuration for the Scalar API Reference for Hono
 */
export type ApiReferenceConfiguration = ScalarApiReferenceConfiguration & HtmlRenderingOptions
