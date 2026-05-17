import { array, object, optional, record, string, union } from '@scalar/validation'

export const XScalarEnvVar = object(
  {
    name: string(),
    value: union([object({ description: optional(string()), default: string() }), string()]),
  },
  {
    typeName: 'XScalarEnvVar',
  },
)

export const XScalarEnvironment = object(
  {
    description: optional(string()),
    color: string({
      typeComment: 'Color for the environment',
    }),
    variables: array(XScalarEnvVar, {
      typeComment: 'An array of variables',
    }),
  },
  {
    typeName: 'XScalarEnvironment',
    typeComment: 'A map of environments by name',
  },
)

export const XScalarEnvironments = object(
  {
    'x-scalar-environments': optional(record(string(), XScalarEnvironment)),
  },
  {
    typeName: 'XScalarEnvironments',
    typeComment: 'A record of environments by name',
  },
)
