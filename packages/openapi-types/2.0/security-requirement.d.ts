/**
 * Security Requirement object
 *
 * Lists the required security schemes to execute this operation. The object can have multiple security schemes declared in it which are all required (that is, there is a logical AND between the schemes).  The name used for each property MUST correspond to a security scheme declared in the [Security Definitions](#security-definitions-object).
 *
 * @see {@link https://swagger.io/specification/v2/#security-requirement-object}
 */
export type SecurityRequirementObject = {
  [key: string]: string[]
}
