import { SecurityRequirementObjectSchema as OriginalSecurityRequirementObjectSchema } from '../processed/security-requirement-object'

/**
 * Security Requirement Object
 *
 * Lists the required security schemes to execute this operation. The name used for each property MUST correspond to a
 * security scheme declared in the Security Schemes under the Components Object.
 *
 * A Security Requirement Object MAY refer to multiple security schemes in which case all schemes MUST be satisfied for
 * a request to be authorized. This enables support for scenarios where multiple query parameters or HTTP headers are
 * required to convey security information.
 *
 * When the security field is defined on the OpenAPI Object or Operation Object and contains multiple Security
 * Requirement Objects, only one of the entries in the list needs to be satisfied to authorize the request. This
 * enables support for scenarios where the API allows multiple, independent security schemes.
 *
 * An empty Security Requirement Object ({}) indicates anonymous access is supported.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#security-requirement-object
 */
export const SecurityRequirementObjectSchema = OriginalSecurityRequirementObjectSchema
