# XML examples

Use `getXmlExampleFromSchema(schema, options)` to generate an XML example, or
`serializeXmlExample(value, schema, options)` to serialize existing schema-ready data.
Both return `{ xml, diagnostics }`. Errors return `xml: undefined`; warnings may
accompany a complete document. The functions do not mutate the schema or supplied data.

```ts
import { getXmlExampleFromSchema } from '@scalar/workspace-store/request-example'

const result = getXmlExampleFromSchema(schema, {
  mode: 'write',
  openapiVersion: '3.2.0',
  compositionSelection: { 'requestBody.oneOf': 1 },
  schemaPath: ['requestBody'],
})
```

The existing data generator makes example, default, variable, composition, and
read/write decisions. XML generation captures its schema provenance instead of
renaming the keys of its output. The ordinary JSON path does not construct an XML
tree or retain provenance. XML capture bypasses the data result cache so a cached
value cannot lose the selected schema or dynamic-reference scope.

## Supported mapping

- Element names, attributes, namespace declarations, and prefixes.
- Wrapped and unwrapped arrays, independent item names, and repeated sibling names.
- Explicit object examples, including pattern properties, without filling in absent properties.
- OpenAPI 3.2 `element`, `attribute`, `text`, `cdata`, and `none` nodes.
- Ordered `prefixItems`, including text before and after child elements.
- References, dynamic bindings, selected composition branches, and composed properties.

Pass the originating OpenAPI version to preserve reference-site XML semantics.
In OpenAPI 3.2 a reference site can introduce an element around a transparent
target. In earlier versions, reference sibling metadata overrides the target.
The default is the legacy mapping when no version is supplied. The 3.2 node kinds
are understood even when version information is unavailable.

## Examples and serialization

At the media-type boundary, `getXmlBodyExample` handles example provenance:

1. Preserve `serializedValue` verbatim, including its whitespace.
2. Serialize `dataValue` using the schema.
3. Preserve a legacy media-level string `value` verbatim, including an edited empty body.
4. Serialize other legacy `value` data using the schema.
5. Generate from the schema when there is no usable example. An unresolved
   `externalValue` follows this fallback; this helper does not fetch URLs.

Schema-level strings are data: markup is escaped inside an element. To provide a
complete XML payload, use a media-level serialized example. No heuristics inspect
whether a string looks like markup.

Pretty printing only adds indentation to element-only content. Mixed-content
text is never trimmed, indented, or compacted. Escaping preserves attribute
whitespace and carriage returns across an XML parser. CDATA terminators are split
into adjacent sections. The writer uses no browser globals and works in Node.

## Diagnostics and bounds

An explicit XML root name takes precedence. A referenced component supplies its
component name. When an element has no inferred name, the fallback is `root`, with
a warning. A document must have exactly one root element; unwrapped root arrays
that produce multiple elements are an error. Declare an array wrapper when the
array represents a complete document.

Null elements use `xsi:nil="true"`; null attributes are omitted with a warning.
Undefined values are omitted. Text, CDATA, and attributes require primitive values;
null text/CDATA is reported as an error because no unambiguous text representation
is defined by this implementation.

Invalid XML names/characters, conflicting namespace bindings, duplicate expanded
attribute names, incompatible composition metadata, relative namespace IRIs, and
conflicting `nodeType`/legacy flags produce errors rather than malformed XML.
Property-pattern matching accepts literals, anchors, character classes, and at most one
un-grouped `*`, `+`, or `?` quantifier, with both inputs limited to 256 characters.
Grouping, alternation, backreferences, counted repetitions, and larger inputs return
an `unsupported-pattern` error; arbitrary JavaScript regexes could block rendering.
Supplied data cycles are errors. Generation retains the existing generator's depth
limit; mapping is bounded to 50 levels and 10,000 nodes. The writer independently
limits the emitted tree to 100 levels and 10,000 nodes, including text and CDATA
nodes. A flat document with 9,999 empty child elements plus its root fits the
writer limit; adding text or nested elements consumes more nodes. These limits
bound synchronous work, so sufficiently large legitimate examples can exceed them.

Limit violations reject the complete document and return a `limit-exceeded` error.
The generation helpers report errors to `console.warn` by default; an `onDiagnostic`
callback can display them in an application. Current UI consumers fall back to
their data representation and do not display a dedicated XML error message. To
preserve a complete large payload without generating an XML tree, supply a
media-level `serializedValue` (or a legacy string `value`).

The legacy `xml: true` data-generator option is deprecated. The schema-free
`json2xml` helper remains available for callers that intentionally use its object
conventions. It is not used by schema-backed XML example generation.

## Playground

Start the API Reference playground and open `/playground/xml-examples/` to inspect
request attributes, namespaces, wrapped arrays, response mixed content, and
composition selection in the reference and request editor.
