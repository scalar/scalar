import { Type } from '@sinclair/typebox'
import { SchemaObject } from './schema'
import { ResponseObject } from './response'
import { ReferenceObject } from './reference'
import { ParameterObject } from './parameter'
import { ExampleObject } from './example'
import { RequestBodyObject } from './request-body'
import { SecuritySchemeObject } from './security-scheme'
import { LinkObject } from './link'
import { CallbackObject } from './callback'
import { PathItemObject } from './path-item'
import { HeaderObject } from './header'

/** Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object will have no effect on the API unless they are explicitly referenced from outside the Components Object. */
export const ComponentsObject = Type.Object({
  /** An object to hold reusable Schema Objects. */
  schemas: Type.Optional(Type.Record(Type.String(), SchemaObject)),
  /** An object to hold reusable Response Objects. */
  responses: Type.Optional(Type.Record(Type.String(), Type.Union([ResponseObject, ReferenceObject]))),
  /** An object to hold reusable Parameter Objects. */
  parameters: Type.Optional(Type.Record(Type.String(), Type.Union([ParameterObject, ReferenceObject]))),
  /** An object to hold reusable Example Objects. */
  examples: Type.Optional(Type.Record(Type.String(), Type.Union([ExampleObject, ReferenceObject]))),
  /** An object to hold reusable Request Body Objects. */
  requestBodies: Type.Optional(Type.Record(Type.String(), Type.Union([RequestBodyObject, ReferenceObject]))),
  /** An object to hold reusable Header Objects. */
  headers: Type.Optional(Type.Record(Type.String(), Type.Union([HeaderObject, ReferenceObject]))),
  /** An object to hold reusable Security Scheme Objects. */
  securitySchemes: Type.Optional(Type.Record(Type.String(), Type.Union([SecuritySchemeObject, ReferenceObject]))),
  /** An object to hold reusable Link Objects. */
  links: Type.Optional(Type.Record(Type.String(), Type.Union([LinkObject, ReferenceObject]))),
  /** An object to hold reusable Callback Objects. */
  callbacks: Type.Optional(Type.Record(Type.String(), Type.Union([CallbackObject, ReferenceObject]))),
  /** An object to hold reusable Path Item Objects. */
  pathItems: Type.Optional(Type.Record(Type.String(), PathItemObject)),
})
