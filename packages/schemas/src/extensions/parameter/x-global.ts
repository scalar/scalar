import { boolean, object, optional } from '@scalar/validation'

/**
 * OpenAPI extension used by the API client to determine if a parameter is global in scope
 * for the entire workspace. When set, this parameter is injected into every request automatically.
 *
 * @example
 * ```yaml
 * x-global: true
 * ```
 */
export const XGlobal = object(
  {
    'x-global': optional(
      boolean({
        typeComment: 'When true, the parameter is injected into every request for the workspace',
      }),
    ),
  },
  {
    typeName: 'XGlobal',
    typeComment:
      'When true, the parameter is injected into every request for the workspace.\n\n@example\n```yaml\nx-global: true\n```',
  },
)
