import { Type, type TSchema } from '@sinclair/typebox'
import { ExternalDocumentationObjectSchema } from './external-documentation'
import { ParameterObjectSchema } from './parameter'
import { ReferenceObjectSchema } from './reference'
import { RequestBodyObjectSchema } from './request-body'
import { ResponsesObjectSchema } from './responses'
import { SecurityRequirementObjectSchema } from './security-requirement'
import { ServerObjectSchema } from './server'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'

export const operationObjectSchemaBuilder = <C extends TSchema>(callback: C) =>
  Type.Union([
    compose(
      Type.Object({
        /** A list of tags for API documentation control. Tags can be used for logical grouping of operations by resources or any other qualifier. */
        tags: Type.Optional(Type.Array(Type.String())),
        /** A short summary of what the operation does. */
        summary: Type.Optional(Type.String()),
        /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
        description: Type.Optional(Type.String()),
        /** Additional external documentation for this operation. */
        externalDocs: Type.Optional(ExternalDocumentationObjectSchema),
        /** Unique string used to identify the operation. The id MUST be unique among all operations described in the API. The operationId value is case-sensitive. Tools and libraries MAY use the operationId to uniquely identify an operation, therefore, it is RECOMMENDED to follow common programming naming conventions. */
        operationId: Type.Optional(Type.String()),
        /** A list of parameters that are applicable for this operation. If a parameter is already defined at the Path Item, the new definition will override it but can never remove it. The list MUST NOT include duplicated parameters. A unique parameter is defined by a combination of a name and location. The list can use the Reference Object to link to parameters that are defined in the OpenAPI Object's components.parameters. */
        parameters: Type.Optional(Type.Array(Type.Union([ParameterObjectSchema, ReferenceObjectSchema]))),
        /** The request body applicable for this operation. The requestBody is fully supported in HTTP methods where the HTTP 1.1 specification RFC7231 has explicitly defined semantics for request bodies. In other cases where the HTTP spec is vague (such as GET, HEAD and DELETE), requestBody is permitted but does not have well-defined semantics and SHOULD be avoided if possible. */
        requestBody: Type.Optional(Type.Union([RequestBodyObjectSchema, ReferenceObjectSchema])),
        /** The list of possible responses as they are returned from executing this operation. */
        responses: Type.Optional(ResponsesObjectSchema),
        /** Declares this operation to be deprecated. Consumers SHOULD refrain from usage of the declared operation. Default value is false. */
        deprecated: Type.Optional(Type.Boolean()),
        /** A declaration of which security mechanisms can be used for this operation. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. To make security optional, an empty security requirement ({}) can be included in the array. This definition overrides any declared top-level security. To remove a top-level security declaration, an empty array can be used. */
        security: Type.Optional(Type.Array(SecurityRequirementObjectSchema)),
        /** An alternative servers array to service this operation. If a servers array is specified at the Path Item Object or OpenAPI Object level, it will be overridden by this value. */
        servers: Type.Optional(Type.Array(ServerObjectSchema)),
        /** A map of possible out-of band callbacks related to the parent operation. The key is a unique identifier for the Callback Object. Each value in the map is a Callback Object that describes a request that may be initiated by the API provider and the expected responses. */
        callbacks: Type.Optional(Type.Record(Type.String(), Type.Union([callback, ReferenceObjectSchema]))),
      }),
      ExtensionsSchema,
    ),
    ReferenceObjectSchema,
  ])
