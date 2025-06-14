import { compose } from '@/schemas/v3.1/compose'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { Type, type Static } from '@sinclair/typebox'

/**
 * Lists the required security schemes to execute this operation. The name used for each property MUST correspond to a security scheme declared in the Security Schemes under the Components Object.
 *
 * A Security Requirement Object MAY refer to multiple security schemes in which case all schemes MUST be satisfied for a request to be authorized. This enables support for scenarios where multiple query parameters or HTTP headers are required to convey security information.
 *
 * When the security field is defined on the OpenAPI Object or Operation Object and contains multiple Security Requirement Objects, only one of the entries in the list needs to be satisfied to authorize the request. This enables support for scenarios where the API allows multiple, independent security schemes.
 *
 * An empty Security Requirement Object ({}) indicates anonymous access is supported.
 */
export const SecurityRequirementObjectSchema = compose(
  Type.Record(
    Type.String(),
    /** Each name MUST correspond to a security scheme which is declared in the Security Schemes under the Components Object. If the security scheme is of type "oauth2" or "openIdConnect", then the value is a list of scope names required for the execution, and the list MAY be empty if authorization does not require a specified scope. For other security scheme types, the array MAY contain a list of role names which are required for the execution, but are not otherwise defined or exchanged in-band. */
    Type.Array(Type.String()),
  ),
  ExtensionsSchema,
)

export type SecurityRequirementObject = Static<typeof SecurityRequirementObjectSchema>
