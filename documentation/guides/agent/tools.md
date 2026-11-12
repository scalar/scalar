# MCP Tools

Choose which operations of your API document become MCP tools, what each tool is called, and the hints clients see about what it does. You can set all of this in the dashboard, or with the `x-scalar-expose` extension in your API document.

## Tool modes

Each API on an MCP server has a tool mode. Pick it in the server's **Configure → Tools** with the production environment selected. Other environments use production's tools and mode.

| Mode | What clients see | Best for |
| --- | --- | --- |
| Individual | One tool per exposed operation, with its own name, description, and annotations. This is the default. | Smaller APIs |
| Dynamic | Two tools, `search` and `execute`. The model searches the exposed operations, then sends a request through `execute`. | Large APIs, where one tool per operation would crowd the model's context |

To set the mode in your API document or the [MCP Config](configuration.md), use `toolMode` in the root `x-scalar-expose`: `direct` for Individual or `generic` for Dynamic.

In Dynamic mode, open the API's **Settings → MCP tools** to choose, per operation, whether the model can find it with **Search** and whether it can send an authenticated request to it with **Execute**. These are two separate switches. Individual mode ignores them: every operation that is a tool can send requests. When you switch an API to Individual mode, turn off the operations that should not make requests before you save.

## Choose and edit tools

In Individual mode, open **Configure → Tools** with the production environment selected to turn operations on or off. Select an operation to open the **Edit tool** dialog, where you can set:

- **Tool name** and **Description**, which the model reads to decide when to call the tool
- **Deprecated** and **Deprecation info**, for tools that still work but should not be used for new work
- **MCP annotations**, described [below](#mcp-annotations)

Settings you save in the dashboard are written to the production [MCP Config](configuration.md) and take precedence over your API document. Only production's Config selects tools; other environments use production's tools.

## `x-scalar-expose`

Add `x-scalar-expose` to your API document to set the same things at the source. Values you set in the dashboard override it, field by field.

```yaml
openapi: 3.1.0
info:
  title: Pet Store
  version: 1.0.0
paths:
  /pets/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      summary: Get a pet
      x-scalar-expose:
        enabled: true
        name: get_pet
        description: Look up one pet by its ID.
    delete:
      summary: Delete a pet
      x-scalar-expose:
        enabled: true
        deprecated: true
        deprecationMessage: Use archive_pet instead.
```

An operation's `x-scalar-expose` accepts these fields:

| Field | Type | Description |
| --- | --- | --- |
| `enabled` | boolean, or `{ mcp, sdk }` | Whether the operation becomes a tool. Use `{ mcp: false }` to hide it from the MCP server only. |
| `name` | string | The tool name. Defaults to the operation's `summary`, such as `get_a_pet`, or to its method and path, such as `get_pets_by_id`. |
| `description` | string | The tool description. Defaults to the operation's `summary`, or to `Call GET /pets/{id}`. |
| `deprecated` | boolean | Marks the tool as deprecated. It stays callable, and its description starts with `[DEPRECATED]`. Defaults to the operation's own `deprecated`, or `x-scalar-stability: deprecated`. |
| `deprecationMessage` | string | Added to the notice of a deprecated tool, for example `[DEPRECATED: Use archive_pet instead.]`. Defaults to `x-scalar-deprecation-message`. |
| `annotations` | object | [MCP annotations](#mcp-annotations) sent with the tool. |

`x-scalar-expose: true` and `x-scalar-expose: false` are short for `enabled: true` and `enabled: false`.

Tool names are sent in snake case, so `getPet` and `get-pet` both become `get_pet`. Names are cut to 108 characters, and a name that is already taken gets a numbered suffix.

### Turn on many operations at once

`enabled` also works on an entry in `tags` and at the root of the document. Scalar uses the first of these that decides:

1. The operation's own `x-scalar-expose`
2. `x-scalar-ignore` or `x-internal` on the operation, which turn the tool off
3. The operation's tags. If any tag sets `false`, the tool is off.
4. The root of the document
5. Otherwise, the operation is a tool

```yaml
openapi: 3.1.0
info:
  title: Pet Store
  version: 1.0.0
x-scalar-expose: false
tags:
  - name: Pets
    x-scalar-expose: true
paths:
  /pets:
    get:
      summary: List pets
      tags:
        - Pets
```

The server's **Automatically add new operations** setting writes `enabled: false` to the root of the production Config when you turn it off. That overrides the root of your API document, so operations added later only become tools when something closer to them turns them on.

On a tag or the document root, `name` and `description` set the name and description of the group its tools belong to. `deprecated`, `deprecationMessage`, and `annotations` only work on operations.

## MCP annotations

[Tool annotations](https://modelcontextprotocol.io/specification/2025-11-25/schema#toolannotations) are hints about what a tool does. Clients use them to group tools and to ask before running a tool that changes data. Some app directories require them: for example, OpenAI's review of ChatGPT apps checks them.

Scalar sends only the annotations you set. It does not guess them from the HTTP method. A tool without annotations is not read-only by default under the MCP specification, and clients may treat it as destructive. Annotations apply to Individual mode, where each operation is its own tool. The `search` and `execute` tools of Dynamic mode do not carry them.

| Annotation | Type | Meaning |
| --- | --- | --- |
| `title` | string | A display name for the tool |
| `readOnlyHint` | boolean | The tool does not change anything |
| `destructiveHint` | boolean | The tool may delete or overwrite data. Only meaningful when `readOnlyHint` is `false`. |
| `idempotentHint` | boolean | Calling the tool again with the same arguments has no further effect. Only meaningful when `readOnlyHint` is `false`. |
| `openWorldHint` | boolean | The tool reaches systems outside your API, such as the web or a third-party service |

Annotations are hints. Clients should not rely on them to decide what is safe, so keep using authorization to control what a tool can do.

### In the dashboard

In the **Edit tool** dialog, the **MCP annotations** section has three settings:

| Setting | Options | Sends |
| --- | --- | --- |
| Behavior | Not set, Read-only, Writes, non-destructive, Destructive | `readOnlyHint` and `destructiveHint` together. Read-only sends `true` and `false`, Writes, non-destructive sends `false` and `false`, Destructive sends `false` and `true`. |
| Idempotent | Not set, Yes, No | `idempotentHint`. Hidden for read-only tools. |
| Open world | Not set, Yes, No | `openWorldHint` |

**Not set** sends whatever your API document sets for that hint, or nothing. Each setting overrides the API document for its own hints only. If the MCP Config sets a pair of `readOnlyHint` and `destructiveHint` that matches no behavior, Behavior also offers **As written in the Config**, which keeps that pair.

### In your API document

Add `annotations` to an operation's `x-scalar-expose`. Annotations can only be set per operation, not on tags or the document root.

```yaml
paths:
  /pets/{id}:
    delete:
      summary: Delete a pet
      x-scalar-expose:
        annotations:
          readOnlyHint: false
          destructiveHint: true
          idempotentHint: true
          openWorldHint: false
```

Scalar sends annotations exactly as written. A key the MCP specification does not define is still sent, so a hint added by a newer version of the specification reaches clients.

A hint with the wrong type, such as `readOnlyHint: "yes"`, is dropped on its own and the other hints are still sent. Clients that check the tool list strictly would otherwise reject every tool over it. In the [MCP Config](configuration.md) editor, a wrong type is an error, and an annotation the MCP specification does not define is a warning, since it may be a typo.

## Related

- [MCP Servers](mcp.md)
- [MCP Configuration](configuration.md)
- [Authentication](authentication/index.md)
