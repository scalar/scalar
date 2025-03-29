import { z } from 'zod'
import { ExternalDocumentationObjectSchema } from './external-documentation-object'
import { ParameterObjectSchema } from './parameter-object'
import { RequestBodyObjectSchema } from './request-body-object'
import { ResponseObjectSchema } from './response-object'
import { SecurityRequirementObjectSchema } from './security-requirement-object'

/**
 * Operation Object (without callbacks, used in callbacks)
 *
 * Describes a single API operation on a path.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#operation-object
 */
export const OperationObjectSchemaWithoutCallbacks = z.object({
  /**
   * A list of tags for API documentation control. Tags can be used for logical
   * grouping of operations by resources or any other qualifier.
   */
  'tags': z.string().array().optional(),
  /**
   * A short summary of what the operation does.
   */
  'summary': z.string().optional(),
  /**
   * A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation.
   */
  'description': z.string().optional(),
  /**
   * External documentation object
   */
  'externalDocs': ExternalDocumentationObjectSchema.optional(),
  /**
   * Unique string used to identify the operation. The id MUST be unique among all operations described in the API.
   * The operationId value is case-sensitive. Tools and libraries MAY use the operationId to uniquely identify an
   * operation, therefore, it is RECOMMENDED to follow bin common programming naming conventions.
   */
  'operationId': z.string().optional(),
  /**
   * A list of parameters that are applicable for this operation. If a parameter is already defined at the Path Item,
   * the new definition will override it but can never remove it. The list MUST NOT include duplicated parameters. A
   * unique parameter is defined by a combination of a name and location. The list can use the Reference Object to link
   * to parameters that are defined in the OpenAPI Object's components.parameters.
   */
  'parameters': ParameterObjectSchema.array().optional(),
  /**
   * The request body applicable for this operation. The requestBody is fully supported in HTTP methods where the
   * HTTP 1.1 specification [RFC7231] has explicitly defined semantics for request bodies. In other cases where the
   * HTTP spec is vague (such as GET, HEAD and DELETE), requestBody is permitted but does not have well-defined
   * semantics and SHOULD be avoided if possible.
   */
  'requestBody': RequestBodyObjectSchema.optional(),
  /**
   * The list of possible responses as they are returned from executing this operation.
   */
  'responses': z.record(z.string(), ResponseObjectSchema).optional(),
  /**
   * A declaration of which security mechanisms can be used across the API. The list of
   * values includes alternative security requirement objects that can be used. Only
   * one of the security requirement objects need to be satisfied to authorize a request.
   * Individual operations can override this definition. To make security optional, an empty
   * security requirement ({}) can be included in the array.
   */
  'security': z.array(SecurityRequirementObjectSchema).optional(),
  /**
   * Declares this operation to be deprecated. Consumers SHOULD refrain from usage of the declared operation. Default
   * value is false.
   */
  'deprecated': z.boolean().optional(),
})
