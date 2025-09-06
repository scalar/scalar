import { Type } from '@scalar/typebox'

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

import { reference } from './reference'

/** Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object will have no effect on the API unless they are explicitly referenced from outside the Components Object. */
export const ComponentsObjectSchemaDefinition = Type.Object({
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
