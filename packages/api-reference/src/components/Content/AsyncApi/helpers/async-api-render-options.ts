import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'

/**
 * Schema-ordering options shared by the AsyncAPI channel, operation, and message renderers.
 *
 * Each surface threads the same subset of the reference configuration through to the shared
 * `Schema`/`ParameterList` components, so they extend this type rather than re-declaring it.
 */
export type AsyncApiSchemaRenderOptions = Pick<
  ApiReferenceConfigurationRaw,
  'orderRequiredPropertiesFirst' | 'orderSchemaPropertiesBy' | 'expandAllSchemaProperties'
>

/**
 * Fill in defaults so the shared renderers always receive a complete ordering options object,
 * regardless of which fields the caller provided.
 */
export const resolveSchemaRenderOptions = (
  options?: Partial<AsyncApiSchemaRenderOptions>,
): AsyncApiSchemaRenderOptions => ({
  orderRequiredPropertiesFirst: options?.orderRequiredPropertiesFirst ?? false,
  orderSchemaPropertiesBy: options?.orderSchemaPropertiesBy ?? 'preserve',
  expandAllSchemaProperties: options?.expandAllSchemaProperties ?? false,
})
