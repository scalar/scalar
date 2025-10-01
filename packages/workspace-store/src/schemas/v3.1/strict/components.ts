import { Type } from '@scalar/typebox'

import type { CallbackObject } from './callback'
import type { ExampleObject } from './example'
import type { HeaderObject } from './header'
import type { LinkObject } from './link'
import type { ParameterObject } from './parameter'
import type { PathItemObject } from './path-item'
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
} from './ref-definitions'
import { type ReferenceType, reference } from './reference'
import type { RequestBodyObject } from './request-body'
import type { ResponsesObject } from './responses'
import type { SchemaObject } from './schema'
import type { SecuritySchemeObject } from './security-scheme'

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

/** Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object will have no effect on the API unless they are explicitly referenced from outside the Components Object. */
export type ComponentsObject = {
  /** An object to hold reusable Schema Objects. */
  schemas?: Record<string, ReferenceType<SchemaObject>>
  /** An object to hold reusable Response Objects. */
  responses?: ResponsesObject
  /** An object to hold reusable Parameter Objects. */
  parameters?: Record<string, ReferenceType<ParameterObject>>
  /** An object to hold reusable Example Objects. */
  examples?: Record<string, ReferenceType<ExampleObject>>
  /** An object to hold reusable Request Body Objects. */
  requestBodies?: Record<string, ReferenceType<RequestBodyObject>>
  /** An object to hold reusable Header Objects. */
  headers?: Record<string, ReferenceType<HeaderObject>>
  /** An object to hold reusable Security Scheme Objects. */
  securitySchemes?: Record<string, ReferenceType<SecuritySchemeObject>>
  /** An object to hold reusable Link Objects. */
  links?: Record<string, ReferenceType<LinkObject>>
  /** An object to hold reusable Callback Objects. */
  callbacks?: Record<string, ReferenceType<CallbackObject>>
  /** An object to hold reusable Path Item Objects. */
  pathItems?: Record<string, PathItemObject>
}
