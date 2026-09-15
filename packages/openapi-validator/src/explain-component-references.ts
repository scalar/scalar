import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import type { AnyObject } from '@scalar/types/utils'

import type { ErrorObject } from '@/types'

/**
 * Encoding a URI does not make an invalid OpenAPI component name valid. Keep
 * this guidance in the OpenAPI layer so other JSON Schema users do not see it.
 */
export const explainComponentReferences = (errors: ErrorObject[], specification: AnyObject): ErrorObject[] =>
  errors.map((error) => {
    if (typeof error.path !== 'string' || !error.path.endsWith('/$ref') || typeof specification.openapi !== 'string') {
      return error
    }

    // Ajv paths are JSON Pointers, not URI fragments: preserve percent signs.
    const segments = error.path
      .split('/')
      .slice(1)
      .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    const reference = getValueAtPath(specification, segments)

    if (typeof reference !== 'string' || !reference.startsWith('#')) {
      return error
    }

    // A malformed escape already has URI guidance; do not guess its target name.
    try {
      // Decode the fragment before splitting: an encoded slash is a separator.
      const component = decodeURIComponent(reference.slice(1)).match(
        /^\/components\/(?:schemas|responses|parameters|examples|requestBodies|headers|securitySchemes|links|callbacks|pathItems|mediaTypes)\/([^/]*)/,
      )?.[1]

      if (component === undefined || /^[a-zA-Z0-9._-]+$/.test(component)) {
        return error
      }
    } catch {
      return error
    }

    return {
      ...error,
      message: `${error.message} OpenAPI component names must match "^[a-zA-Z0-9._-]+$". Rename the component and update its references; percent-encoding alone does not fix the component name.`,
    }
  })
