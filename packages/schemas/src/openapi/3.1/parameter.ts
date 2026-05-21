import {
  type Schema,
  any,
  boolean,
  intersection,
  lazy,
  literal,
  object,
  optional,
  record,
  string,
  union,
} from '@scalar/validation'

import { XInternal, XScalarIgnore } from '@/extensions/document'
import { XGlobal } from '@/extensions/parameter'

import { openApiExampleObject } from './example'
import { createOpenApiMediaTypeSchemas } from './media-type'
import { type MaybeRefFn, normalRef } from './reference'
import { openApiSchemaObject } from './schema'

/**
 * Builds the Parameter Object schema for {@link createOpenApiDocumentSchema}.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 * @returns `parameterObject` — union of parameter-with-schema and parameter-with-content shapes.
 */
export const createOpenApiParameterObject = (maybeRef: MaybeRefFn): Schema => {
  const { mediaTypeObject } = createOpenApiMediaTypeSchemas(maybeRef)

  const parameterWithSchema: Schema = intersection(
    [
      object({
        name: string({
          typeComment:
            'REQUIRED. The name of the parameter. Parameter names are case sensitive. If in is "path", the name field MUST correspond to a template expression occurring within the path field in the Paths Object.',
        }),
        in: union([literal('query'), literal('header'), literal('path'), literal('cookie')], {
          typeName: 'ParameterLocation',
          typeComment:
            'REQUIRED. The location of the parameter. Possible values are "query", "header", "path" or "cookie".',
        }),
        description: optional(
          string({
            typeComment:
              'A brief description of the parameter. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        required: optional(
          boolean({
            typeComment:
              'Determines whether this parameter is mandatory. If the parameter location is "path", this field is REQUIRED and its value MUST be true.',
          }),
        ),
        deprecated: optional(
          boolean({
            typeComment:
              'Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is false.',
          }),
        ),
        allowEmptyValue: optional(
          boolean({
            typeComment:
              'If true, clients MAY pass a zero-length string value in place of parameters that would otherwise be omitted entirely. This field is valid only for query parameters.',
          }),
        ),
        allowReserved: optional(
          boolean({
            typeComment:
              'When this is true, parameter values are serialized using reserved expansion, as defined by RFC6570. This field only applies to parameters with an in value of query. The default value is false.',
          }),
        ),
        style: optional(
          string({
            typeComment: 'Describes how the parameter value will be serialized (depending on the schema type).',
          }),
        ),
        explode: optional(
          boolean({
            typeComment:
              'When this is true, parameter values of type array or object generate separate parameters for each array item or object property.',
          }),
        ),
        schema: optional(maybeRef(lazy(() => openApiSchemaObject))),
        example: optional(any()),
        examples: optional(
          record(string(), maybeRef(lazy(() => openApiExampleObject)), { typeName: 'ParameterExamples' }),
        ),
      }),
      XGlobal,
      XInternal,
      XScalarIgnore,
    ],
    { typeName: 'ParameterObjectWithSchema' },
  )

  const parameterWithContent: Schema = intersection(
    [
      object({
        name: string({
          typeComment:
            'REQUIRED. The name of the parameter. Parameter names are case sensitive. If in is "path", the name field MUST correspond to a template expression occurring within the path field in the Paths Object.',
        }),
        in: union([literal('query'), literal('header'), literal('path'), literal('cookie')], {
          typeName: 'ParameterLocation',
          typeComment:
            'REQUIRED. The location of the parameter. Possible values are "query", "header", "path" or "cookie".',
        }),
        description: optional(
          string({
            typeComment:
              'A brief description of the parameter. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        required: optional(
          boolean({
            typeComment:
              'Determines whether this parameter is mandatory. If the parameter location is "path", this field is REQUIRED and its value MUST be true.',
          }),
        ),
        deprecated: optional(
          boolean({
            typeComment:
              'Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is false.',
          }),
        ),
        allowEmptyValue: optional(
          boolean({
            typeComment:
              'If true, clients MAY pass a zero-length string value in place of parameters that would otherwise be omitted entirely. This field is valid only for query parameters.',
          }),
        ),
        allowReserved: optional(
          boolean({
            typeComment:
              'When this is true, parameter values are serialized using reserved expansion, as defined by RFC6570. This field only applies to parameters with an in value of query. The default value is false.',
          }),
        ),
        content: optional(
          record(
            string(),
            lazy(() => mediaTypeObject),
            {
              typeName: 'ParameterContent',
            },
          ),
        ),
      }),
      XGlobal,
      XInternal,
      XScalarIgnore,
    ],
    { typeName: 'ParameterObjectWithContent' },
  )

  return union([parameterWithSchema, parameterWithContent], { typeName: 'ParameterObject' })
}

export const openApiParameterObject = createOpenApiParameterObject(normalRef)
