# CI and Scripting

Run the [Scalar CLI](getting-started.md) in pipelines and scripts: authenticate without a browser, turn lint findings into CI reports, adopt linting on an existing API description, and read results as JSON.

## Run without prompts

Many commands prompt when a value is missing, and a prompt blocks a non-interactive run. Pass every value as an argument or flag instead, for example `--output` on `document bundle` and `document upgrade`, `--yes` on `project rollback`, and `--force` on `project init`.

Results go to stdout. Errors go to stderr, prefixed with `[ERROR]`, and exit with status `1`.

## Authentication

Log in with a personal token instead of a browser:

```bash
scalar auth login --token "$SCALAR_TOKEN"
```

Or set `SCALAR_API_KEY` and run `scalar auth login`. When both are set, `SCALAR_API_KEY` wins. See [Authentication](authentication.md) for creating a token.

## Lint reports

The default `codeframe` report shows findings alongside the relevant source lines. Choose a structured format to use lint results in CI:

```bash
scalar document lint openapi.yaml --format codeframe
scalar document lint openapi.yaml --format summary
scalar document lint openapi.yaml --format github-actions
scalar document lint openapi.yaml --format markdown --output lint-results.md
scalar document lint openapi.yaml --format json --output lint-results.json
scalar document lint openapi.yaml --format junit --output lint-results.xml
```

Reports go to stdout unless you provide `--output`. Status and upgrade notices go to stderr, so you can also redirect stdout to a report file. Reports are written even when lint findings cause the command to fail. Prefer `--output` over shell redirection in scripts: Scalar checks that the destination is not the input document, the ruleset, the baseline, or a referenced file, which the shell cannot do. Parent directories must already exist.

| Format           | Output                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `codeframe`      | Findings with source excerpts and carets at the reported locations. This is the default. `NO_COLOR=1` turns colors off.                                                                                                                                                                                                                                                                                                                     |
| `text`           | Human-readable findings with engine-native locations.                                                                                                                                                                                                                                                                                                                                                                                       |
| `markdown`       | Markdown tables grouped by source, followed by validation totals.                                                                                                                                                                                                                                                                                                                                                                           |
| `summary`        | Finding counts grouped by severity and rule, followed by validation totals.                                                                                                                                                                                                                                                                                                                                                                 |
| `json`           | An object with the CLI package `version` (for example, `"2.10.0"`), a `problems` array, and `totals` containing `errors`, `warnings`, and `ignored` counts. Each problem contains `ruleId`, `severity` (`error`, `warn`, `info`, or `hint`), `message`, a `location` array, `suggest`, and an optional `reference` URL. Locations contain `source.ref`, a JSON `pointer`, and `start`/`end` positions with 1-based `line` and `col` values. |
| `github-actions` | Error, warning, and notice annotations. Local file paths are relative to `GITHUB_WORKSPACE`, or the current directory outside Actions. Remote sources appear in the message without a repository file attachment.                                                                                                                                                                                                                           |
| `junit`          | JUnit XML grouped by source, with one test case per displayed finding. Errors use `error`, warnings use `failure`, and information and hints use `system-out`. A separate totals suite records all active errors, warnings, ignored findings, and hidden findings. A clean run produces a valid report with zero tests.                                                                                                                     |

By default, reports display at most 100 findings, ordered by severity. Use `--max-problems` to change this limit. Totals and the exit status always include all active findings, even when some are hidden:

```bash
scalar document lint openapi.yaml --format json --max-problems 1000 --output lint-results.json
```

JUnit viewers may mark warnings as failed tests even though warnings do not fail the CLI command.

GitHub Actions annotations must reach the runner's stdout to appear. If you save them with `--output`, print that file in a subsequent step that also runs when lint fails. For JUnit or JSON, configure your CI to upload the report even when lint fails. See the [Registry CI example](../registry/rules.md#integration-with-cicd).

## Adopt linting on an existing API description

An ignore baseline lets you adopt linting without fixing every existing finding first:

```bash
scalar document lint openapi.yaml --generate-ignore-file
scalar document lint openapi.yaml --format github-actions
```

Commit the generated `.scalar.lint-ignore.yaml`. Future runs automatically load it from the current working directory and omit matching findings from reports. If that file is absent, the CLI falls back to `.redocly.lint-ignore.yaml` in the same directory. The Scalar file takes priority when both exist. Generation always writes `.scalar.lint-ignore.yaml` unless you select another path with `--ignore-file`. The CLI does not search parent directories.

Use `--ignore-file` to choose a different path for both generation and subsequent runs. Relative paths are resolved from the current working directory:

```bash
mkdir -p config
scalar document lint openapi.yaml --generate-ignore-file --ignore-file config/lint-ignore.yaml
scalar document lint openapi.yaml --ignore-file config/lint-ignore.yaml
```

Generation records all current findings and exits successfully after writing the baseline. Regenerating replaces the selected input document's entries while preserving other inputs' entries, including findings in shared referenced files. To baseline several documents, run generation once for each input with the same ignore file.

Entries match by source document, rule, and document path, independently of line numbers, severity, or message text. Local source paths are relative to the baseline directory. Several findings with the same identity share one entry. Renaming documents, reordering arrays, or changing rules may create new identities. Resolved entries can suppress a later recurrence at the same identity until you regenerate the baseline, so review baseline changes before committing them.

The baseline uses Redocly's source → rule → JSON pointer layout:

```yaml
openapi.yaml:
  info-description:
    - '#/info'
```

### Coming from Redocly

When `.scalar.lint-ignore.yaml` is absent, lint falls back to `.redocly.lint-ignore.yaml`, or you can rename that file. Scalar's file wins when both exist. Scalar does not read `redocly.yaml`.

These Redocly rules map onto Scalar's default ruleset: `info-contact`, `info-license`, `operation-description`, `operation-operationId`, `operation-operationId-url-safe`, `no-path-trailing-slash`, `path-declaration-must-exist`, `path-not-include-query`, `tag-description`, and `operation-singular-tag`. Entries for other rules are reported on stderr and only match exact Scalar rule and pointer pairs. `operation-2xx-response` is deliberately not mapped, because Scalar's `operation-success-response` also accepts 3xx responses.

## Exit status

Only errors that are not in the baseline cause exit code `1`. Warnings, information, and hints do not fail linting. Operational failures, malformed baselines, and missing explicitly selected ignore files also exit nonzero. Missing default ignore files are allowed.

## AsyncAPI in CLI 2.10.0

In CLI 2.10.0, linting an AsyncAPI document with the built-in rules fails before producing a report. As a workaround, use an AsyncAPI ruleset with a rule customization to select the Spectral engine. For example, save this as `asyncapi-rules.yaml`:

```yaml
extends: spectral:asyncapi
rules:
  asyncapi-info-description: warn
```

Then pass it explicitly when linting or generating a baseline:

```bash
scalar document lint asyncapi.yaml --rule asyncapi-rules.yaml --format json
scalar document lint asyncapi.yaml --rule asyncapi-rules.yaml --generate-ignore-file
```

## JSON output

Commands that read from Scalar accept `--json` and print to stdout, so scripts never parse tables. Empty results are `[]`.

```bash
scalar project list --json
scalar project get my-docs --json
scalar team list --json
scalar team get --json
scalar registry list --namespace acme --json
scalar schema list --json
scalar sdk list --namespace acme --json
scalar sdk get --slug widgets --namespace acme --json
```

| Command                       | Returns                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project list`, `project get` | `uid`, `name`, `slug`, `provider`, `isPrivate`, `repository`, and `activeDeployment`. An unlinked repository or missing live deployment is `null`. |
| `team list`                   | An array of `{ uid, name, current }`.                                                                                                              |
| `team get`                    | `{ uid, name, slug, namespaces }`.                                                                                                                 |
| `registry list`               | `namespace`, `slug`, `title`, `version`, and `isPrivate`, without document content.                                                                |
| `schema list`                 | `namespace`, `slug`, `title`, `version` (`null` before the first version), and `isPrivate`.                                                        |
| `sdk list`, `sdk get`         | The linked API, target languages, current version, version history, and the latest build attempt. Timestamps are Unix seconds.                     |

`--namespace` defaults to your current team's first namespace. To download a document, use `registry get` or `schema get`:

```bash
scalar registry get acme demo-api --version 1.2.3 > openapi.json
```
