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

Pick a report format for wherever the results are read:

```bash
scalar document lint openapi.yaml --format codeframe
scalar document lint openapi.yaml --format summary
scalar document lint openapi.yaml --format github-actions
scalar document lint openapi.yaml --format markdown --output lint-results.md
scalar document lint openapi.yaml --format json --output lint-results.json
scalar document lint openapi.yaml --format junit --output lint-results.xml
```

| Format | Output |
| --- | --- |
| `codeframe` | The default. Source excerpts with highlighted carets. `NO_COLOR=1` turns colors off. |
| `text` | The native engine report. |
| `summary` | Finding counts by rule and severity. |
| `markdown` | Tables grouped by source file, for pull request comments. |
| `github-actions` | Error, warning, and notice annotations at the file and line of each finding. |
| `json` | Redocly's report shape: `totals`, `version`, and a `problems` array with JSON pointer locations. |
| `junit` | One test suite per source and one test case per finding, for test-report viewers. |

Reports go to stdout unless you pass `--output`, and they are written even when findings make the command fail. Prefer `--output` over shell redirection in scripts: Scalar checks that the destination is not the input document, the ruleset, the baseline, or a referenced file, which the shell cannot do. Parent directories must already exist.

`--max-problems <number>` caps the findings shown, 100 by default, errors first. Counts and the exit status always include every finding. Only errors fail the command; warnings, information, and hints do not.

Machine-readable formats use 1-based line and column numbers. GitHub Actions annotations use paths relative to `GITHUB_WORKSPACE`. In JUnit reports, errors become `error` entries and warnings become `failure` entries, so test viewers show warnings as failed even though lint still exits successfully. Upload reports even when the lint step fails.

## Adopt linting on an existing API description

Record today's findings in a baseline, commit it, and from then on only new findings are reported:

```bash
scalar document lint openapi.yaml --generate-ignore-file
git add .scalar.lint-ignore.yaml
```

Later runs read `.scalar.lint-ignore.yaml` from the current directory automatically. Pass `--ignore-file <file>` to use another location. Generating a baseline records every current finding and exits successfully.

The baseline uses Redocly's source → rule → JSON pointer layout:

```yaml
openapi.yaml:
  info-description:
    - '#/info'
```

Matching ignores message, severity, and line changes, so edits elsewhere in the document do not break it. Renaming a document, reordering an array, or changing a rule can make a finding look new.

### Coming from Redocly

When `.scalar.lint-ignore.yaml` is absent, lint falls back to `.redocly.lint-ignore.yaml`, or you can rename that file. Scalar's file wins when both exist. Scalar does not read `redocly.yaml`.

These Redocly rules map onto Scalar's default ruleset: `info-contact`, `info-license`, `operation-description`, `operation-operationId`, `operation-operationId-url-safe`, `no-path-trailing-slash`, `path-declaration-must-exist`, `path-not-include-query`, `tag-description`, and `operation-singular-tag`. Entries for other rules are reported on stderr and only match exact Scalar rule and pointer pairs. `operation-2xx-response` is deliberately not mapped, because Scalar's `operation-success-response` also accepts 3xx responses.

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

| Command | Returns |
| --- | --- |
| `project list`, `project get` | `uid`, `name`, `slug`, `provider`, `isPrivate`, `repository`, and `activeDeployment`. An unlinked repository or missing live deployment is `null`. |
| `team list` | An array of `{ uid, name, current }`. |
| `team get` | `{ uid, name, slug, namespaces }`. |
| `registry list` | `namespace`, `slug`, `title`, `version`, and `isPrivate`, without document content. |
| `schema list` | `namespace`, `slug`, `title`, `version` (`null` before the first version), and `isPrivate`. |
| `sdk list`, `sdk get` | The linked API, target languages, current version, version history, and the latest build attempt. Timestamps are Unix seconds. |

`--namespace` defaults to your current team's first namespace. To download a document, use `registry get` or `schema get`:

```bash
scalar registry get acme demo-api --version 1.2.3 > openapi.json
```
