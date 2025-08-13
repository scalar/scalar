import {
  Type,
  type Static,
  type TIntersect,
  type TObject,
  type TOptional,
  type TRecord,
  type TString,
  type TUnion,
} from '@sinclair/typebox'

import { compose } from '@/schemas/compose'

import { SchemaObjectSchema } from './schema'
import { ResponseObjectSchema } from './response'
import { ReferenceObjectSchema } from './reference'
import { ParameterObjectSchema } from './parameter'
import { ExampleObjectSchema } from './example'
import { RequestBodyObjectSchema } from './request-body'
import { SecuritySchemeObjectSchema } from './security-scheme'
import { LinkObjectSchema } from './link'
import { ExtensionsSchema } from './extensions'
import { HeaderObjectSchema } from './media-header-encoding'
import { CallbackObjectSchema, PathItemObjectSchema } from './path-operations'

/**
 * The type annotation is needed because the inferred type of this node exceeds the maximum length the compiler will serialize.
 * This is due to the complex nested structure of the Components Object schema, which includes multiple optional fields,
 * arrays, and nested objects. The explicit type annotation helps TypeScript handle this large type definition.
 *
 * @see https://github.com/microsoft/TypeScript/issues/43817#issuecomment-827746462
 */
export type ComponentsObjectSchemaType = TIntersect<
  [
    TObject<{
      /** Schema Objects that define input and output data types. These can be objects, primitives, and arrays, and are a superset of JSON Schema Specification Draft 2020-12. */
      schemas: TOptional<TRecord<TString, typeof SchemaObjectSchema>>
      /** Response Objects that describe a single response from an API operation, including headers, content, and links. */
      responses: TOptional<TRecord<TString, TUnion<[typeof ResponseObjectSchema, typeof ReferenceObjectSchema]>>>
      /** Parameter Objects that describe a single operation parameter with a unique combination of name and location (query, header, path, or cookie). */
      parameters: TOptional<TRecord<TString, TUnion<[typeof ParameterObjectSchema, typeof ReferenceObjectSchema]>>>
      /** Example Objects that group example values with metadata for demonstrating usage of properties, parameters, and objects. */
      examples: TOptional<TRecord<TString, TUnion<[typeof ExampleObjectSchema, typeof ReferenceObjectSchema]>>>
      /** Request Body Objects that describe a single request body with content and optional required flag. */
      requestBodies: TOptional<TRecord<TString, TUnion<[typeof RequestBodyObjectSchema, typeof ReferenceObjectSchema]>>>
      /** Header Objects that describe HTTP response headers and multipart representation headers, following Parameter Object structure. */
      headers: TOptional<TRecord<TString, TUnion<[typeof HeaderObjectSchema, typeof ReferenceObjectSchema]>>>
      /** Security Scheme Objects that define security mechanisms for API operations (apiKey, http, mutualTLS, oauth2, openIdConnect). */
      securitySchemes: TOptional<
        TRecord<TString, TUnion<[typeof SecuritySchemeObjectSchema, typeof ReferenceObjectSchema]>>
      >
      /** Link Objects that represent design-time links for responses, providing relationships and traversal mechanisms between operations. */
      links: TOptional<TRecord<TString, TUnion<[typeof LinkObjectSchema, typeof ReferenceObjectSchema]>>>
      /** Callback Objects that describe out-of-band callbacks related to parent operations, with Path Item Objects for request definitions. */
      callbacks: TOptional<TRecord<TString, TUnion<[typeof CallbackObjectSchema, typeof ReferenceObjectSchema]>>>
      /** Path Item Objects that describe operations available on a single path, including HTTP methods and shared parameters. */
      pathItems: TOptional<TRecord<TString, typeof PathItemObjectSchema>>
    }>,
    typeof ExtensionsSchema,
  ]
>

/** Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object will have no effect on the API unless they are explicitly referenced from outside the Components Object. */
export const ComponentsObjectSchema: ComponentsObjectSchemaType = compose(
  Type.Object({
    /** An object to hold reusable Schema Objects. */
    schemas: Type.Optional(Type.Record(Type.String(), SchemaObjectSchema)),
    /** An object to hold reusable Response Objects. */
    responses: Type.Optional(Type.Record(Type.String(), Type.Union([ResponseObjectSchema, ReferenceObjectSchema]))),
    /** An object to hold reusable Parameter Objects. */
    parameters: Type.Optional(Type.Record(Type.String(), Type.Union([ParameterObjectSchema, ReferenceObjectSchema]))),
    /** An object to hold reusable Example Objects. */
    examples: Type.Optional(Type.Record(Type.String(), Type.Union([ExampleObjectSchema, ReferenceObjectSchema]))),
    /** An object to hold reusable Request Body Objects. */
    requestBodies: Type.Optional(
      Type.Record(Type.String(), Type.Union([RequestBodyObjectSchema, ReferenceObjectSchema])),
    ),
    /** An object to hold reusable Header Objects. */
    headers: Type.Optional(Type.Record(Type.String(), Type.Union([HeaderObjectSchema, ReferenceObjectSchema]))),
    /** An object to hold reusable Security Scheme Objects. */
    securitySchemes: Type.Optional(
      Type.Record(Type.String(), Type.Union([SecuritySchemeObjectSchema, ReferenceObjectSchema])),
    ),
    /** An object to hold reusable Link Objects. */
    links: Type.Optional(Type.Record(Type.String(), Type.Union([LinkObjectSchema, ReferenceObjectSchema]))),
    /** An object to hold reusable Callback Objects. */
    callbacks: Type.Optional(Type.Record(Type.String(), Type.Union([CallbackObjectSchema, ReferenceObjectSchema]))),
    /** An object to hold reusable Path Item Objects. */
    pathItems: Type.Optional(Type.Record(Type.String(), PathItemObjectSchema)),
  }),
  ExtensionsSchema,
)

export type ComponentsObject = Static<typeof ComponentsObjectSchema>
