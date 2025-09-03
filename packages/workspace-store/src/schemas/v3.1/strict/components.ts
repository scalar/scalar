import {
  Type,
  type Static,
  type TObject,
  type TOptional,
  type TRecord,
  type TString,
  type TUnion,
} from '@scalar/typebox'
import { reference, type ReferenceType } from './reference'
import {
  CallbackObjectRef,
  ExampleObjectRef,
  HeaderObjectRef,
  LinkObjectRef,
  ParameterObjectRef,
  PathItemObjectRef,
  RequestBodyObjectRef,
  ResponseObjectRef,
  SchemaObjectRef,
  SecuritySchemeObjectRef,
} from '@/schemas/v3.1/strict/ref-definitions'

/**
 * The type annotation is needed because the inferred type of this node exceeds the maximum length the compiler will serialize.
 * This is due to the complex nested structure of the Components Object schema, which includes multiple optional fields,
 * arrays, and nested objects. The explicit type annotation helps TypeScript handle this large type definition.
 *
 * @see https://github.com/microsoft/TypeScript/issues/43817#issuecomment-827746462
 */
export type ComponentsObjectSchemaType = TObject<{
  /** Schema Objects that define input and output data types. These can be objects, primitives, and arrays, and are a superset of JSON Schema Specification Draft 2020-12. */
  schemas: TOptional<TRecord<TString, TUnion<[typeof SchemaObjectRef, ReferenceType<typeof SchemaObjectRef>]>>>
  /** Response Objects that describe a single response from an API operation, including headers, content, and links. */
  responses: TOptional<TRecord<TString, TUnion<[typeof ResponseObjectRef, ReferenceType<typeof ResponseObjectRef>]>>>
  /** Parameter Objects that describe a single operation parameter with a unique combination of name and location (query, header, path, or cookie). */
  parameters: TOptional<TRecord<TString, TUnion<[typeof ParameterObjectRef, ReferenceType<typeof ParameterObjectRef>]>>>
  /** Example Objects that group example values with metadata for demonstrating usage of properties, parameters, and objects. */
  examples: TOptional<TRecord<TString, TUnion<[typeof ExampleObjectRef, ReferenceType<typeof ExampleObjectRef>]>>>
  /** Request Body Objects that describe a single request body with content and optional required flag. */
  requestBodies: TOptional<
    TRecord<TString, TUnion<[typeof RequestBodyObjectRef, ReferenceType<typeof RequestBodyObjectRef>]>>
  >
  /** Header Objects that describe HTTP response headers and multipart representation headers, following Parameter Object structure. */
  headers: TOptional<TRecord<TString, TUnion<[typeof HeaderObjectRef, ReferenceType<typeof HeaderObjectRef>]>>>
  /** Security Scheme Objects that define security mechanisms for API operations (apiKey, http, mutualTLS, oauth2, openIdConnect). */
  securitySchemes: TOptional<
    TRecord<TString, TUnion<[typeof SecuritySchemeObjectRef, ReferenceType<typeof SecuritySchemeObjectRef>]>>
  >
  /** Link Objects that represent design-time links for responses, providing relationships and traversal mechanisms between operations. */
  links: TOptional<TRecord<TString, TUnion<[typeof LinkObjectRef, ReferenceType<typeof LinkObjectRef>]>>>
  /** Callback Objects that describe out-of-band callbacks related to parent operations, with Path Item Objects for request definitions. */
  callbacks: TOptional<TRecord<TString, TUnion<[typeof CallbackObjectRef, ReferenceType<typeof CallbackObjectRef>]>>>
  /** Path Item Objects that describe operations available on a single path, including HTTP methods and shared parameters. */
  pathItems: TOptional<TRecord<TString, typeof PathItemObjectRef>>
}>

/** Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object will have no effect on the API unless they are explicitly referenced from outside the Components Object. */
export const ComponentsObjectSchemaDefinition: ComponentsObjectSchemaType = Type.Object({
  /** An object to hold reusable Schema Objects. */
  schemas: Type.Optional(Type.Record(Type.String(), Type.Union([SchemaObjectRef, reference(SchemaObjectRef)]))),
  /** An object to hold reusable Response Objects. */
  responses: Type.Optional(Type.Record(Type.String(), Type.Union([ResponseObjectRef, reference(ResponseObjectRef)]))),
  /** An object to hold reusable Parameter Objects. */
  parameters: Type.Optional(
    Type.Record(Type.String(), Type.Union([ParameterObjectRef, reference(ParameterObjectRef)])),
  ),
  /** An object to hold reusable Example Objects. */
  examples: Type.Optional(Type.Record(Type.String(), Type.Union([ExampleObjectRef, reference(ExampleObjectRef)]))),
  /** An object to hold reusable Request Body Objects. */
  requestBodies: Type.Optional(
    Type.Record(Type.String(), Type.Union([RequestBodyObjectRef, reference(RequestBodyObjectRef)])),
  ),
  /** An object to hold reusable Header Objects. */
  headers: Type.Optional(Type.Record(Type.String(), Type.Union([HeaderObjectRef, reference(HeaderObjectRef)]))),
  /** An object to hold reusable Security Scheme Objects. */
  securitySchemes: Type.Optional(
    Type.Record(Type.String(), Type.Union([SecuritySchemeObjectRef, reference(SecuritySchemeObjectRef)])),
  ),
  /** An object to hold reusable Link Objects. */
  links: Type.Optional(Type.Record(Type.String(), Type.Union([LinkObjectRef, reference(LinkObjectRef)]))),
  /** An object to hold reusable Callback Objects. */
  callbacks: Type.Optional(Type.Record(Type.String(), Type.Union([CallbackObjectRef, reference(CallbackObjectRef)]))),
  /** An object to hold reusable Path Item Objects. */
  pathItems: Type.Optional(Type.Record(Type.String(), PathItemObjectRef)),
})

export type ComponentsObject = Static<typeof ComponentsObjectSchemaDefinition>
