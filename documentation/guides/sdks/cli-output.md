# CLI Output Formats

Generated API commands write successful results to stdout and errors to stderr. Use `--format` for results and `--format-error` for errors. These flags override [`targets.cli.defaultFormat`](configuration/cli.md#defaultformat) and [`targets.cli.defaultErrorFormat`](configuration/cli.md#defaulterrorformat) for one invocation. Both settings default to `auto`; an unsupported value falls back to `auto`.

For example, this configuration makes successful results human-readable and errors machine-readable:

```json
{
  "targets": {
    "cli": {
      "binaryName": "acme",
      "defaultFormat": "pretty",
      "defaultErrorFormat": "json"
    }
  }
}
```

The examples below use a generated `acme` CLI whose `widgets list` command returns two widgets. Unless pagination or streaming is explicitly mentioned, the response is an ordinary array.

## auto

The default. Prints the same two-space-indented JSON as `json`, both in a terminal and when piped or redirected. It does not automatically switch to a table in a terminal.

```bash
acme widgets list --format auto
```

```json
[
  {
    "id": 1,
    "name": "Bolt",
    "active": true
  },
  {
    "id": 2,
    "name": "Nut",
    "active": false
  }
]
```

## json

Two-space-indented JSON, suitable for JSON parsers such as `jq`. A paginated list is collected across pages into one array, subject to `--max-items`.

```bash
acme widgets list --format json
```

```json
[
  {
    "id": 1,
    "name": "Bolt",
    "active": true
  },
  {
    "id": 2,
    "name": "Nut",
    "active": false
  }
]
```

## jsonl

Compact JSON, with one output record per line. An ordinary response is one record, so an ordinary array is printed on one line rather than split into items:

```bash
acme widgets list --format jsonl
```

```json
[{"id":1,"name":"Bolt","active":true},{"id":2,"name":"Nut","active":false}]
```

For a command configured with pagination, each item is a separate record, emitted as it arrives across pages:

```bash
acme widgets list --format jsonl --max-items 2
```

```text
{"id":1,"name":"Bolt","active":true}
{"id":2,"name":"Nut","active":false}
```

Streaming commands also emit each event separately. Prefer `jsonl` for a stream consumed by a program: even `--format json` prints events individually, rather than wrapping the whole stream in one JSON array.

## pretty

A human-readable view. A non-empty list of objects becomes a table, with columns in the order fields first appear. Booleans become `yes`/`no`, and null or missing values become blank cells.

```bash
acme widgets list --format pretty
```

```text
  widgets list
╭────┬──────┬────────╮
│ id │ name │ active │
├────┼──────┼────────┤
│ 1  │ Bolt │ yes    │
│ 2  │ Nut  │ no     │
╰────┴──────┴────────╯
```

Tables shorten wide cells with an ellipsis to fit the terminal. If fitting would require cutting a column below ten characters, the output becomes a card instead. Pipes and files get full-width tables. Nested values in table cells can be summarized, so use `json` or `yaml` when every detail matters.

A single object, an empty list, or another value prints as a bordered key/value card. For example, a `widgets get` command returning the first widget prints:

```bash
acme widgets get 1 --format pretty
```

```text
  widgets get
╭─────────────╮
│ id: 1       │
│ name: Bolt  │
│ active: yes │
╰─────────────╯
```

In a terminal, cards wrap long values to fit its width, indenting each continuation line under the line it continues. Pipes and files get full, unwrapped values.

## raw

Prints strings without quotes and other values as compact JSON. This is a serialization of the decoded response body, not the original HTTP bytes or headers.

```bash
acme widgets list --format raw
```

```json
[{"id":1,"name":"Bolt","active":true},{"id":2,"name":"Nut","active":false}]
```

For a paginated command, `raw` makes a single request and prints its response envelope, including pagination metadata, instead of collecting items across pages.

Use `--transform` to select a field before formatting. For example:

```bash
acme widgets get 1 --transform name --format raw
```

```text
Bolt
```

The separate `--raw-output` (`-r`) flag also prints selected string values without quotes while leaving the chosen format in use for non-string values:

```bash
acme widgets get 1 --transform name --format json --raw-output
```

```text
Bolt
```

## toon

Token-Oriented Object Notation: structured text intended for AI agents, with less repeated syntax for lists of flat objects. The `[2]` count says how many items follow, `{id,name,active}` names the columns, and each following row supplies their values.

```bash
acme widgets list --format toon
```

```text
[2]{id,name,active}:
  1,Bolt,true
  2,Nut,false
```

Other shapes use key/value lines or lists. Strings are quoted when needed to distinguish them from numbers, booleans, or structural syntax. An empty list is `[0]:`, and an empty object is `{}`. Streaming commands frame each event as a one-element list with its own `[1]` header.

## yaml

YAML serialization of the response value. Like `json`, a paginated list is collected across pages into one value, subject to `--max-items`.

```bash
acme widgets list --format yaml
```

```yaml
- id: 1
  name: Bolt
  active: true
- id: 2
  name: Nut
  active: false
```

## Error output

`--format-error` accepts the same seven names, independently of `--format`. Errors go to stderr and the command exits with a nonzero status: `2` for a usage error, `10` through `15` for the HTTP and connection classes named by `code`, and `1` otherwise. This controls failures caught while running generated API commands, including an `@file` argument that cannot be read and a refused confirmation. Missing or invalid arguments and a rejected `--environment` are reported by the command parser as plain text. Built-in commands such as `login` and `logout` use their own error presentation. The formatted error body can contain `message`, `code`, `status`, `requestId`, an actionable `hint`, and `body` (the parsed API error payload), depending on the failure.

- `auto` (the default) and `pretty` print indented JSON, colored red when coloring is enabled. Error `pretty` does not draw the success table or card.
- `json` prints indented JSON without the error coloring.
- `jsonl` prints the error object as compact JSON on one line.
- `yaml` and `toon` serialize the error object in those formats.
- `raw` prints only the message, followed by the hint when present.

For example, an unclassified error whose message is `Something went wrong` prints this on stderr:

```bash
acme widgets list --format-error json
```

```json
{
  "name": "Error",
  "code": "error",
  "message": "Something went wrong"
}
```

The same error with `--format-error raw` prints:

```bash
acme widgets list --format-error raw
```

```text
Something went wrong
```
