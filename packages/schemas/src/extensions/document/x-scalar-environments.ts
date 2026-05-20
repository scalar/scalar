import { array, object, optional, record, string, union } from '@scalar/validation'

/** A scalar environment variable */
export const XScalarEnvVar = object(
  {
    name: string({ typeComment: 'Variable name' }),
    value: union([object({ description: optional(string()), default: string() }), string()], {
      typeComment: 'Variable value as a string, or an object with description and default',
    }),
  },
  {
    typeName: 'XScalarEnvVar',
    typeComment: 'An environment variable definition',
  },
)

/** An environment definition */
export const XScalarEnvironment = object(
  {
    description: optional(string({ typeComment: 'Optional description for the environment' })),
    color: string({
      typeComment: 'Color for the environment (for example a hex value)',
    }),
    variables: array(XScalarEnvVar, {
      typeComment: 'Variables available in this environment',
    }),
  },
  {
    typeName: 'XScalarEnvironment',
    typeComment: 'A named environment with variables and display color',
  },
)

export const XScalarEnvironments = object(
  {
    'x-scalar-environments': optional(
      record(string(), XScalarEnvironment, {
        typeComment: 'Environments keyed by name',
      }),
    ),
  },
  {
    typeName: 'XScalarEnvironments',
    typeComment:
      'Named environments with variables for the API client (base URLs, tokens, etc.).\n\n@example\n```yaml\nx-scalar-environments:\n  production:\n    color: "#00ff00"\n    variables:\n      - name: apiKey\n        value: prod-key\n```',
  },
)
