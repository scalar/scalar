import { Type, type TSchema } from '@sinclair/typebox'
import { ParameterObjectSchema } from './parameter'
import { ReferenceObjectSchema } from './reference'
import { ServerObjectSchema } from './server'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'

export const pathItemObjectSchemaBuilder = <O extends TSchema>(operation: O) =>
  compose(
    Type.Object({
      /**
       * Allows for a referenced definition of this path item. The value MUST be in the form of a URI, and the referenced structure MUST be in the form of a Path Item Object. In case a Path Item Object field appears both in the defined object and the referenced object, the behavior is undefined. See the rules for resolving Relative References.
       *
       * Note: The behavior of $ref with adjacent properties is likely to change in future versions of this specification to bring it into closer alignment with the behavior of the Reference Object.
       */
      '$ref': Type.Optional(Type.String()),
      /** An optional string summary, intended to apply to all operations in this path. */
      summary: Type.Optional(Type.String()),
      /** An optional string description, intended to apply to all operations in this path. CommonMark syntax MAY be used for rich text representation. */
      description: Type.Optional(Type.String()),
      /** A definition of a GET operation on this path. */
      get: Type.Optional(operation),
      /** A definition of a PUT operation on this path. */
      put: Type.Optional(operation),
      /** A definition of a POST operation on this path. */
      post: Type.Optional(operation),
      /** A definition of a DELETE operation on this path. */
      delete: Type.Optional(operation),
      /** A definition of a PATCH operation on this path. */
      patch: Type.Optional(operation),
      /** A definition of a TRACE operation on this path. */
      trace: Type.Optional(operation),
      /** An alternative servers array to service all operations in this path. If a servers array is specified at the OpenAPI Object level, it will be overridden by this value. */
      servers: Type.Optional(Type.Array(ServerObjectSchema)),
      /** A list of parameters that are applicable for all the operations described under this path. These parameters can be overridden at the operation level, but cannot be removed there. The list MUST NOT include duplicated parameters. A unique parameter is defined by a combination of a name and location. The list can use the Reference Object to link to parameters that are defined in the OpenAPI Object's components.parameters. */
      parameters: Type.Optional(Type.Array(Type.Union([ParameterObjectSchema, ReferenceObjectSchema]))),
    }),
    ExtensionsSchema,
  )
