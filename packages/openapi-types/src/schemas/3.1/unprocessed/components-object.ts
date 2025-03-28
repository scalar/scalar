import { z } from 'zod'
import { ComponentsObjectSchema as OriginalComponentsObjectSchema } from '../processed/components-object'
import { CallbackObjectSchema } from './callback-object'
import { ExampleObjectSchema } from './example-object'
import { HeaderObjectSchema } from './header-object'
import { LinkObjectSchema } from './link-object'
import { ParameterObjectSchema } from './parameter-object'
import { PathItemObjectSchema } from './path-item-object'
import { ReferenceObjectSchema } from './reference-object'
import { RequestBodyObjectSchema } from './request-body-object'
import { ResponseObjectSchema } from './response-object'
import { SchemaObjectSchema } from './schema-object'
import { SecuritySchemeObjectSchema } from './security-scheme-object'

/**
 * Components Object
 *
 * Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object
 * will have no effect on the API unless they are explicitly referenced from outside the Components Object.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#components-object
 */
export const ComponentsObjectSchema = OriginalComponentsObjectSchema.extend({
  /**
   * An object to hold reusable Schema Objects.
   */
  schemas: z.record(z.string(), SchemaObjectSchema).optional(),
  /**
   * An object to hold reusable Response Objects.
   */
  responses: z.record(z.string(), z.union([ReferenceObjectSchema, ResponseObjectSchema])).optional(),
  /**
   * An object to hold reusable Parameter Objects.
   */
  parameters: z.record(z.string(), z.union([ReferenceObjectSchema, ParameterObjectSchema])).optional(),
  /**
   * An object to hold reusable Example Objects.
   */
  examples: z.record(z.string(), z.union([ReferenceObjectSchema, ExampleObjectSchema])).optional(),
  /**
   * An object to hold reusable Request Body Objects.
   */
  requestBodies: z.record(z.string(), z.union([ReferenceObjectSchema, RequestBodyObjectSchema])).optional(),
  /**
   * An object to hold reusable Header Objects.
   */
  headers: z.record(z.string(), z.union([ReferenceObjectSchema, HeaderObjectSchema])).optional(),
  /**
   * An object to hold reusable Security Scheme Objects.
   */
  securitySchemes: z.record(z.string(), z.union([ReferenceObjectSchema, SecuritySchemeObjectSchema])).optional(),
  /**
   * An object to hold reusable Link Objects.
   */
  links: z.record(z.string(), z.union([ReferenceObjectSchema, LinkObjectSchema])).optional(),
  /**
   * An object to hold reusable Callback Objects.
   */
  callbacks: z.record(z.string(), z.union([ReferenceObjectSchema, CallbackObjectSchema])).optional(),
  /**
   * An object to hold reusable Path Item Objects.
   */
  pathItems: z.record(z.string(), PathItemObjectSchema).optional(),
})
