import { Type } from '@sinclair/typebox'
import { ExternalDocumentationObject } from './external-documentation'
import { ParameterObject } from './parameter'
import { ReferenceObject } from './reference'
import { RequestBodyObject } from './request-body'
import { ResponsesObject } from './responses'
import { SecurityRequirementObject } from './security-requirement'
import { ServerObject } from './server'

/** Describes a single API operation on a path. */
export const OperationObjectWithoutCallback = Type.Union([
  Type.Object({
    /** A list of tags for API documentation control. Tags can be used for logical grouping of operations by resources or any other qualifier. */
    tags: Type.Optional(Type.Array(Type.String())),
    /** A short summary of what the operation does. */
    summary: Type.Optional(Type.String()),
    /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** Additional external documentation for this operation. */
    externalDocs: Type.Optional(ExternalDocumentationObject),
    /** Unique string used to identify the operation. The id MUST be unique among all operations described in the API. The operationId value is case-sensitive. Tools and libraries MAY use the operationId to uniquely identify an operation, therefore, it is RECOMMENDED to follow common programming naming conventions. */
    operationId: Type.Optional(Type.String()),
    /** A list of parameters that are applicable for this operation. If a parameter is already defined at the Path Item, the new definition will override it but can never remove it. The list MUST NOT include duplicated parameters. A unique parameter is defined by a combination of a name and location. The list can use the Reference Object to link to parameters that are defined in the OpenAPI Object's components.parameters. */
    parameters: Type.Optional(Type.Array(Type.Union([ParameterObject, ReferenceObject]))),
    /** The request body applicable for this operation. The requestBody is fully supported in HTTP methods where the HTTP 1.1 specification RFC7231 has explicitly defined semantics for request bodies. In other cases where the HTTP spec is vague (such as GET, HEAD and DELETE), requestBody is permitted but does not have well-defined semantics and SHOULD be avoided if possible. */
    requestBody: Type.Optional(Type.Union([RequestBodyObject, ReferenceObject])),
    /** The list of possible responses as they are returned from executing this operation. */
    responses: Type.Optional(ResponsesObject),
    /** Declares this operation to be deprecated. Consumers SHOULD refrain from usage of the declared operation. Default value is false. */
    deprecated: Type.Optional(Type.Boolean()),
    /** A declaration of which security mechanisms can be used for this operation. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. To make security optional, an empty security requirement ({}) can be included in the array. This definition overrides any declared top-level security. To remove a top-level security declaration, an empty array can be used. */
    security: Type.Optional(Type.Array(SecurityRequirementObject)),
    /** An alternative servers array to service this operation. If a servers array is specified at the Path Item Object or OpenAPI Object level, it will be overridden by this value. */
    servers: Type.Optional(Type.Array(ServerObject)),
  }),
  ReferenceObject,
])
