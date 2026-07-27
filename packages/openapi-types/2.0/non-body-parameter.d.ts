import type { FormDataParameterSubSchemaObject } from './form-data-parameter-sub-schema.js'
import type { HeaderParameterSubSchemaObject } from './header-parameter-sub-schema.js'
import type { PathParameterSubSchemaObject } from './path-parameter-sub-schema.js'
import type { QueryParameterSubSchemaObject } from './query-parameter-sub-schema.js'
/**
 * Non-body parameter object
 *
 * A non-body parameter is one of: header, query, path, or formData. Each sub-type is discriminated by the `in` field.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameter-object}
 */
export type NonBodyParameterObject =
  | HeaderParameterSubSchemaObject
  | FormDataParameterSubSchemaObject
  | QueryParameterSubSchemaObject
  | PathParameterSubSchemaObject
