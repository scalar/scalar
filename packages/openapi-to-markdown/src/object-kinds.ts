import type { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  CallbackObjectSchema,
  ExampleObjectSchema,
  HeaderObjectSchema,
  LinkObjectSchema,
  MediaTypeObjectSchema,
  OperationObjectSchema,
  ParameterObjectSchema,
  PathItemObjectSchema,
  RequestBodyObjectSchema,
  ResponseObjectSchema,
  SecuritySchemeObjectSchema,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** The OpenAPI objects outside of schemas that the linking pass tells apart. */
export type ObjectKind =
  | 'document'
  | 'components'
  | 'pathItem'
  | 'operation'
  | 'callback'
  | 'response'
  | 'requestBody'
  | 'mediaType'
  | 'encoding'
  | 'parameter'
  | 'header'
  | 'example'
  | 'link'
  | 'securityScheme'

/** A value is either one object of a kind, or a map or array whose values all have that kind. */
export type KindPosition = ObjectKind | { values: ObjectKind }

type TargetSchema = Parameters<typeof coerceValue>[0]

const methods = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace', 'connect', 'query']

/**
 * Mirrors the OpenAPI 3.2 structure of the strict workspace schemas, so a reference knows which
 * object it stands in for. A `*` key applies to every field, such as the expressions of a callback.
 */
const childKinds: Partial<Record<ObjectKind, Record<string, KindPosition>>> = {
  document: {
    paths: { values: 'pathItem' },
    webhooks: { values: 'pathItem' },
    components: 'components',
  },
  components: {
    responses: { values: 'response' },
    parameters: { values: 'parameter' },
    examples: { values: 'example' },
    requestBodies: { values: 'requestBody' },
    headers: { values: 'header' },
    securitySchemes: { values: 'securityScheme' },
    links: { values: 'link' },
    callbacks: { values: 'callback' },
    pathItems: { values: 'pathItem' },
    mediaTypes: { values: 'mediaType' },
  },
  pathItem: {
    ...Object.fromEntries(methods.map((method): [string, KindPosition] => [method, 'operation'])),
    additionalOperations: { values: 'operation' },
    parameters: { values: 'parameter' },
  },
  operation: {
    parameters: { values: 'parameter' },
    requestBody: 'requestBody',
    responses: { values: 'response' },
    callbacks: { values: 'callback' },
  },
  callback: { '*': 'pathItem' },
  response: { headers: { values: 'header' }, content: { values: 'mediaType' }, links: { values: 'link' } },
  requestBody: { content: { values: 'mediaType' } },
  mediaType: {
    examples: { values: 'example' },
    encoding: { values: 'encoding' },
    prefixEncoding: { values: 'encoding' },
    itemEncoding: 'encoding',
  },
  encoding: { headers: { values: 'header' } },
  parameter: { examples: { values: 'example' }, content: { values: 'mediaType' } },
  header: { examples: { values: 'example' }, content: { values: 'mediaType' } },
}

/** Returns the kind of the value stored under `key`, or `undefined` outside the known structure. */
export const getChildKind = (position: KindPosition, key: string): KindPosition | undefined => {
  if (typeof position !== 'string') {
    return position.values
  }
  const children = childKinds[position]
  return children?.[key] ?? children?.['*']
}

/** Strict schemas for the objects that a Reference Object can stand in for. */
export const referenceTargetSchemas: Partial<Record<ObjectKind, TargetSchema>> = {
  pathItem: PathItemObjectSchema,
  operation: OperationObjectSchema,
  callback: CallbackObjectSchema,
  response: ResponseObjectSchema,
  requestBody: RequestBodyObjectSchema,
  mediaType: MediaTypeObjectSchema,
  parameter: ParameterObjectSchema,
  header: HeaderObjectSchema,
  example: ExampleObjectSchema,
  link: LinkObjectSchema,
  securityScheme: SecuritySchemeObjectSchema,
}
