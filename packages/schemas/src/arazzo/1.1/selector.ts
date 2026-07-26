import { object, string } from '@scalar/validation'

/**
 * Selector Object.
 *
 * Describes a location within a context (for example a response body) to extract a value from,
 * using an expression type such as `jsonpath` or `xpath`.
 */
export const arazzoSelectorObject = object(
  {
    context: string({
      typeComment: 'REQUIRED. A Runtime Expression that defines the context to apply the selector to.',
    }),
    selector: string({ typeComment: 'REQUIRED. The selector expression to apply to the context.' }),
    type: string({ typeComment: 'REQUIRED. The type of selector expression, for example "jsonpath" or "xpath".' }),
  },
  { typeName: 'ArazzoSelectorObject' },
)
