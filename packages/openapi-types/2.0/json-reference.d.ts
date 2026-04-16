/**
 * Reference object
 *
 * A simple object to allow referencing other definitions in the specification. It can be used to reference parameters and responses that are defined at the top level for reuse.  The Reference Object is a [JSON Reference](http://tools.ietf.org/html/draft-pbryan-zyp-json-ref-02) that uses a [JSON Pointer](http://tools.ietf.org/html/rfc6901) as its value. For this specification, only [canonical dereferencing](https://tools.ietf.org/html/draft-zyp-json-schema-04#section-7.2.3) is supported.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#reference-object}
 */
export type JsonReferenceObject = {
  $ref: string
}
