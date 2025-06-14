import { Type, type Static } from '@sinclair/typebox'
import { SchemaObjectSchema } from './schema'
import { ResponseObjectSchema } from './response'
import { ReferenceObjectSchema } from './reference'
import { ParameterObjectSchema } from './parameter'
import { ExampleObjectSchema } from './example'
import { RequestBodyObjectSchema } from './request-body'
import { SecuritySchemeObjectSchema } from './security-scheme'
import { LinkObjectSchema } from './link'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'
import { HeaderObjectSchema } from '@/schemas/v3.1/strict/media-header-encoding'
import { CallbackObjectSchema, PathItemObjectSchema } from '@/schemas/v3.1/strict/path-operations'

/** Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object will have no effect on the API unless they are explicitly referenced from outside the Components Object. */
export const ComponentsObjectSchema = compose(
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
