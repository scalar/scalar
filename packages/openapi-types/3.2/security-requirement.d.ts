/**
 * Security Requirement object
 *
 * Lists the required security schemes to execute this operation.  The name used for each property MUST either correspond to a security scheme declared in the [Security Schemes](#components-security-schemes) under the [Components Object](#components-object), or be the URI of a Security Scheme Object. Property names that are identical to a component name under the Components Object MUST be treated as a component name. To reference a Security Scheme with a single-segment relative URI reference (e.g. `foo`) that collides with a component name (e.g. `#/components/securitySchemes/foo`), use the `.` path segment (e.g. `./foo`).  Using a Security Scheme component name that appears to be a URI is NOT RECOMMENDED, as the precedence of component-name-matching over URI resolution, which is necessary to maintain compatibility with prior OAS versions, is counter-intuitive. See also [Security Considerations](#security-considerations).  A Security Requirement Object MAY refer to multiple security schemes in which case all schemes MUST be satisfied for a request to be authorized. This enables support for scenarios where multiple query parameters or HTTP headers are required to convey security information.  When the `security` field is defined on the [OpenAPI Object](#openapi-object) or [Operation Object](#operation-object) and contains multiple Security Requirement Objects, only one of the entries in the list needs to be satisfied to authorize the request. This enables support for scenarios where the API allows multiple, independent security schemes.  An empty Security Requirement Object (`{}`) indicates anonymous access is supported.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2#security-requirement-object}
 */
export type SecurityRequirementObject = {
  [key: string]: string[]
}
