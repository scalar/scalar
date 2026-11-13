# Upgrading referenced fragments

`upgradeFragment` upgrades a complete API description or a fragment whose kind and source dialect are known. It returns a copy and leaves the input unchanged. Unlike `upgrade`, it does not infer a version or require a wrapper API description.

```ts
import { upgradeFragment } from '@scalar/openapi-upgrader'

const { value, locations } = await upgradeFragment(
  { type: 'string', nullable: true },
  { from: '3.0', to: '3.1', kind: 'schema' },
)
// value: { type: ['string', 'null'] }
```

Kinds include `document`, `schema`, `parameter`, `header`, `response`, `path-item`, `operation`, `request-body`, and `callback`. Pass effective `consumes` and `produces` for OpenAPI 2.0 fragments; both default to `application/json`. Form parameters use form-compatible media types and fall back to `multipart/form-data`. A schema with an explicit `$schema` is retained in its declared dialect. Examples, defaults, and extension payloads remain literal data.

For OpenAPI 2.0 operations containing parameter references, supply `resolveSource(ref)`, an asynchronous lookup of the original parameter. Body parameters become the operation's `requestBody`, while form parameters combine into one request body. These parameter objects are inlined; nested schema references remain references. A body or form parameter cannot be upgraded as `kind: 'parameter'`: use the owning operation, or `request-body` when that is explicitly the intended destination.

`locations` maps original JSON Pointer segment arrays to converted arrays, including moved descendants. A resolver applies the longest matching source prefix to incoming authored pointers. For example, `['definitions', 'Pet']` maps to `['components', 'schemas', 'Pet']`. Keep original source data for parameter lookups, and do not remap generated bundle pointers. If a schema is copied into multiple media types, the first location is the canonical reference target. `contexts` records effective operation media types for later resolution.

## Bundler lifecycle

JSON Magic exposes two asynchronous lifecycle hooks through `BundleConfig.hooks` or a `LifecyclePlugin`:

- `onDocumentLoaded(document, { uri, loadDocument })` runs before indexing a root, external, cached, or previously bundled resource. Return replacement content, or `undefined` to retain it. `loadDocument(uri)` shares source loading without recursively applying transforms.
- `onBeforeTargetProcess(target, context)` runs after locating a reference target and before traversing it. The context includes the target resource, resource-relative path, URI, referring node context, and `referenceSource` location. Return `{ value }` to replace the target, or `{ value, path }` to keep a contextual conversion at another resource-relative path.

A document resolver can return `remapPointer(pointer)` for authored pointers into transformed resources, and `visitReferencedSubtrees: true` for headerless resources that need reference context before traversal. For a partial bundle, pass `root` and its `inputPath` so hooks receive the semantic referring location.

The workspace store uses these hooks to upgrade complete resources according to their declared version, and bare fragments according to the original owning API description. It caches contextual variants separately and persists `x-scalar-upgrade` metadata with relocation mappings and source context so serialization and lazy loading preserve resolution behavior.
