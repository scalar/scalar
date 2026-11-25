# URLs

Registry URLs let you open an API reference, fetch an API description, or download other Registry resources. Use the namespace and slug shown in the Scalar Dashboard to build a URL.

## Browse a namespace

Listing or searching a namespace requires sign-in, and anyone with a direct URL can fetch a public resource.

- `https://registry.scalar.com/@your-namespace` opens the namespace overview.
- `https://registry.scalar.com/@your-namespace/apis` lists API descriptions. Use `/schemas`, `/rules`, `/sdks`, or `/workspaces` to browse the other resource types.
- `https://registry.scalar.com/@your-namespace/search?q=planets` returns matching resources as JSON.

## API descriptions

Use this base URL for an API description.

```text
https://registry.scalar.com/@your-namespace/apis/your-api
```

OpenAPI and AsyncAPI use the same URL structure.

| Use                                    | Example                                                                                                | Response                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Open an API reference                  | [Galaxy preview](https://registry.scalar.com/@scalar/apis/galaxy?format=preview)                       | Interactive HTML preview                                                        |
| Fetch JSON                             | [Galaxy JSON](https://registry.scalar.com/@scalar/apis/galaxy?format=json)                             | API description as JSON                                                         |
| Fetch YAML                             | [Galaxy YAML](https://registry.scalar.com/@scalar/apis/galaxy?format=yaml)                             | API description as YAML                                                         |
| Fetch JSON with generated SDK examples | [Processed Galaxy JSON](https://registry.scalar.com/@scalar/apis/galaxy?format=json&variant=processed) | API description with SDK examples and installation instructions, when available |
| Fetch an AsyncAPI description          | [Galaxy Events JSON](https://registry.scalar.com/@scalar/apis/asyncapi?format=json)                    | AsyncAPI description as JSON                                                    |

### Choose a format

A URL without a format opens a preview in a browser. For requests made by tools such as `curl`, the Registry returns JSON by default.

Set `format=json`, `format=yaml`, or `format=preview` to make the format explicit. A trailing path segment works too, such as [`/yaml`](https://registry.scalar.com/@scalar/apis/galaxy/yaml).

When you specify more than one format, the Registry uses the first applicable value in this order.

1. The `X-OpenAPI-Format` header, with `json`, `yaml`, or `preview`.
2. A trailing `/json`, `/yaml`, or `/preview` path segment.
3. The `format` query parameter.
4. The `Accept` header. Use `text/html` for a preview, `application/json` for JSON, or `application/yaml` for YAML.

### Choose a version

| Version                        | Example path                   | What it selects                                    |
| ------------------------------ | ------------------------------ | -------------------------------------------------- |
| Current                        | `/@scalar/apis/galaxy`         | The version set as current in the Registry         |
| Latest                         | `/@scalar/apis/galaxy@latest`  | The highest published semantic version             |
| Specific version               | `/@scalar/apis/galaxy@0.7.4`   | The content published under that version label     |
| Specific content or Git commit | `/@scalar/apis/galaxy@dffb5b5` | The content matching that SHA or unique SHA prefix |

Use `/0.7.4` in place of `@0.7.4` if you prefer a separate path segment. The leading `@` on the namespace is optional in resource URLs.

Current and latest can differ. Use the current URL to follow the version selected in the Dashboard. An explicit version stays on its label, and re-uploading that version can replace its content.

For an API description or schema, use a full content SHA to pin its content. Read the `X-Scalar-Document-Sha` header on a raw JSON response to find the content SHA. For Git-synced documents, the commit SHA is available in `X-Scalar-Commit-Sha`. A prefix can have 6 to 64 hexadecimal characters. An ambiguous prefix returns `404`. If a value also matches a version label, the version label takes precedence.

### Include generated SDK examples

JSON and YAML requests return the published source by default. Use `variant=raw` to request it explicitly.

Set `variant=processed` on a current, latest, or version-labeled API URL to include SDK code samples and installation instructions from the [SDK Generator](../sdks/getting-started.md). If the Registry has no generated SDK content for that version, it returns the source document. SHA-pinned API URLs serve the source content.

A browser preview of the current, latest, or named version loads the processed document automatically. To show the same SDK content in a separately hosted API reference, configure its source with an explicit format and variant.

```js
Scalar.createApiReference('#app', {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json&variant=processed',
})
```

## Other Registry resources

| Resource                     | URL pattern                                                             | Use                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [JSON Schema](schemas.md)    | `https://registry.scalar.com/@your-namespace/schemas/your-schema@1.0.0` | Reference a shared schema with `$ref`. Schema URLs support version and SHA selectors.            |
| [Spectral ruleset](rules.md) | `https://registry.scalar.com/@your-namespace/rules/your-ruleset`        | Pass the URL to `scalar document lint --rule`. Ruleset URLs serve the current ruleset.           |
| SDK                          | `https://registry.scalar.com/@your-namespace/sdks/your-sdk`             | Open the SDK download page in a browser or retrieve a JSON list of available builds from a tool. |
| Workspace                    | `https://registry.scalar.com/@your-namespace/workspaces/your-workspace` | Preview the workspace's API sources or request its JSON or YAML document.                        |

To download a generated SDK ZIP, choose a language on the [Galaxy SDK download page](https://registry.scalar.com/@scalar/sdks/galaxy) or add `?lang=typescript` to the page URL.

| SDK download               | Example path                                              |
| -------------------------- | --------------------------------------------------------- |
| Current TypeScript build   | `/@scalar/sdks/galaxy?lang=typescript`                    |
| Latest version             | `/@scalar/sdks/galaxy@latest?lang=typescript`             |
| Active build for a version | `/@scalar/sdks/galaxy@0.7.4?lang=typescript`              |
| Specific build             | `/@scalar/sdks/galaxy@0.7.4+360116025fdf?lang=typescript` |

Copy a download URL from the SDK page to get the version and build hash for that language.

## Temporary share links

A temporary share link uses `https://registry.scalar.com/share/apis/<id>` for an API description or `https://registry.scalar.com/share/schemas/<id>` for a schema. Both paths also accept `/@share/` in place of `/share/`. An API share link opens a preview in a browser, and `?format=json` or `?format=yaml` fetches the shared document. Anyone with the link can access it until it expires.

## Access

For a private resource, sign in to the Registry preview with an account that has access. For scripts, use the authenticated [Scalar CLI](cli.md) or send a Scalar access token in the `X-Scalar-Auth` request header.
