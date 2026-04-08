/**
 * Reference object
 *
 * A simple object to allow referencing other components in the OpenAPI Description, internally and externally.  The Reference Object is defined by [JSON Reference](https://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03) and follows the same structure, behavior and rules.  For this specification, reference resolution is accomplished as defined by the JSON Reference specification and not by the JSON Schema specification.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#reference-object}
 */
export type ReferenceObject = Record<string, string>
