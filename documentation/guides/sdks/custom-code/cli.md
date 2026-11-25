# CLI Commands

> [!WARNING]
> Experimental: `targets.cli.customCode` may change in a later release, before it is stable.

Most custom code is an edit to the generated files, carried forward on every build by a three-way merge (see [Overview](overview.md)). A generated CLI can also take commands that are not edits at all: commands of your own, written in TypeScript, that sit beside the generated ones in the same tree.

You write one TypeScript file and name it in the config. Commands, their handlers and the packages they import are code, not config, so the config only says where the file is and what it depends on.

Builds that Scalar runs for you do not take custom commands yet. For now a CLI with custom code is built with the generator's own command line (`scalar-sdk-generator generate`).

## Configuration

Add `customCode` to the CLI target:

```json
{
  "targets": {
    "cli": {
      "customCode": {
        "implementation": "commands/index.ts",
        "dependencies": {
          "escape-string-regexp": "^5.0.0"
        }
      }
    }
  }
}
```

- **`implementation`** is the file, relative to the custom folder. It ends in `.ts` and is not a test or declaration file.
- **`dependencies`** lists the npm packages the custom code imports, each with a version constraint. They are merged into the CLI's `package.json`. A package the CLI already depends on (`commander`, `ansis`, `yaml`, `typescript`, `@types/node`, and `ws` and `@types/ws` in a CLI that uses WebSockets) is refused, since the generator owns its version.
- **`dir`** moves the custom folder out of the CLI repository (see below).

The [configuration reference](../configuration/cli.md#customcode) lists every rule for each key.

## Where the custom folder lives

By default the folder is `custom/` at the root of the CLI repository, beside the generated `src/`. The generator never writes to it, so it is yours the same way any file you add to the repository is.

Set `dir` to keep the folder beside your Scalar config instead, for example when the config lives in another repository. The path is relative to the config file's directory. Each build copies the folder's files into the CLI repository's `custom/` byte for byte, so relative imports between them resolve the same way in both places. It also removes copies an earlier build made of files you have since deleted. Test files (`*.test.ts`, `*.spec.ts` and anything under `__tests__/`) stay where they are: they are neither copied nor built into the CLI.

A target uses one layout. Setting `dir`, or passing `--custom-code` (below), while the CLI repository also has a `custom/` folder the generator did not copy fails with `CliCustomCode/TwoLayouts`.

Generation fails with one of these codes when it cannot read the folder:

| Code | Cause |
| --- | --- |
| `CliCustomCode/MissingFile` | The file `implementation` names does not exist. |
| `CliCustomCode/UnsafePath` | A path is absolute, leaves its folder, or uses a reserved folder name, in any letter case. |
| `CliCustomCode/Symlink` | The folder is, or contains, a symbolic link. |
| `CliCustomCode/TooLarge` | A file is over 1 MiB, the folder is over 20 MiB, or it holds more than 2,000 files and folders. |
| `CliCustomCode/TwoLayouts` | `dir` or `--custom-code` is set and the CLI repository has its own `custom/` folder, or a copy there was edited since the generator made it. |

## Writing commands

The file exports `generateCommands(cli, runtime)`. The CLI calls it once its generated commands are registered, and each `cli.command(path)` chain adds one command:

```ts
import { type GenerateCommands, parseInteger } from '#cli'

export const generateCommands: GenerateCommands = (cli) => {
  cli
    .command('hello')
    .description('Say hello')
    .option('--name <name>', 'Who to greet')
    .option('--times <count>', 'How many greetings', parseInteger, 1)
    .auth('none')
    .globals('output')
    .example('acme hello --name Ada')
    .action((ctx) => {
      if (ctx.flags.times < 1) ctx.usageError('--times must be at least 1')
      return { greetings: Array(ctx.flags.times).fill(`Hello, ${ctx.flags.name ?? 'world'}`) }
    })

  cli
    .command('widgets first')
    .description('Print the first widget')
    .action(cli.lazy(() => import('./widgets/first')))
}
```

`#cli` is the one supported import from the CLI's internals. It holds the chain, the `Ctx` type, `CliError`, and the `parseInteger` and `parseNumber` parsers. `#sdk` is the embedded SDK's public client, and `#custom/*` a file in the custom folder. A command's parent may be a generated group, as `widgets` is above. A path that is already taken fails when the program is built. The exception is a chain that says `.replaces()`: it takes over the generated command at that path, and the SDK method stays. The names of the CLI's own commands (`help`, `completion`, `context`, `environments`, `upgrade`, `uninstall`, `login` and `logout`) are refused as a top-level command or alias, even in a CLI that does not register them.

The chain decides what the handler's `ctx` has, and the CLI's own `tsc` checks each handler against its chain:

| Chain | Effect |
| --- | --- |
| `.argument(spec)`, `.option(flags)`, `.requiredOption(flags)` | Typed `ctx.args` and `ctx.flags`. |
| `.auth('required' \| 'optional' \| 'none')` | `ctx.client()`, built with the same credential resolution generated commands use. `none` drops the credential flags. The default is `required`. |
| `.globals('api' \| 'output' \| 'none')` | Which global flags the command accepts. The default is `api`. |
| `.interactive('never' \| 'optional' \| 'required')` | Whether `ctx.prompt` may ask. The default is `never`: a command that does not say otherwise never prompts. |
| `.longRunning()` | `ctx.signal`, aborted on SIGINT or SIGTERM (exit 130 or 143). |
| `.session('read' \| 'write')` | `ctx.session`, to read or store the sign-in. Only in a CLI with `login`. |
| `.exitCode(code, description)` | An exit status the command owns, documented under EXIT STATUS: 1 to 255, and none of 2, 10 to 15, 130 and 143, which the CLI reports itself. |
| `.passthrough()` | The words after `--`, handed over literally as `ctx.passthrough`. |

A value the handler returns is printed through `--format`, as generated commands print theirs. `ctx.fail` reports an error through `--format-error`. `ctx.usageError` prints a plain usage message and exits 2.

Every invocation runs `generateCommands`, including `--help`. Wrap a handler in `cli.lazy` so its module, and whatever it imports, loads only when that command runs. A lazy handler types its `ctx` with `Ctx`:

```ts
import type { Ctx } from '#cli'

export default async (ctx: Ctx<{ client: 'required' }>) => {
  const client = await ctx.client()
  const widgets = await client.widgets.list()
  return widgets[0] ?? null
}
```

For what the chain cannot express, `cli.program` is the Commander root. Commands added there still appear in help, the man pages and the README.

To start a command, set `targets.cli.customCode` first, then run `scalar-sdk-generator custom-code add cli "<command path>"`. `-c` names the config (`scalar-sdk.config.json` by default). With `dir`, the stub goes in that folder; without it, in the `custom/` folder of the CLI repository `-o` names (the current directory by default). It writes a lazy handler stub that compiles. If the custom-code file is missing, it writes that too, with the command's chain in it. If the file exists, it is left alone and the command prints the chain to add inside `generateCommands`.

## Hooks

The same file can register hooks on `cli`. They run for generated commands and for commands registered with `cli.command`. They never run for `--help`, `--version`, the CLI's own commands (such as `login` and `completion`), or a command added straight on `cli.program`.

```ts
export const generateCommands: GenerateCommands = (cli) => {
  cli.flagDefaults(() => ({
    'widgets list': { format: process.env.ACME_FORMAT },
  }))
  cli.beforeCommand((ctx) => (process.env.ACME_PAUSED ? { exitCode: 9 } : undefined))
  cli.afterCommand((ctx, result) => {})
  cli.onError((ctx, error) => {})
  cli.clientOptions((ctx, options) => ({
    ...options,
    defaultHeaders: { ...options.defaultHeaders, 'X-Client': 'acme-cli' },
  }))
}
```

| Hook | Runs | Effect |
| --- | --- | --- |
| `cli.flagDefaults` | After the command parsed, before its required inputs are checked | Supplies values for inputs the caller left out (see below). |
| `cli.beforeCommand` | Before the command, and before its confirmation prompt | Returning `{ exitCode }` skips the command with that status: 1 to 255, and none the CLI reports itself (2, 10 to 15, 130, 143). |
| `cli.afterCommand` | After a command that succeeded | Receives the value the command produced: `undefined` for a streamed or paged result. The command's output is already written by then, so a hook that throws here is reported as an error after it, with a non-zero exit. |
| `cli.onError` | When a command fails | Observes the error, which is still reported through `--format-error`. A hook that throws does not replace it. |
| `cli.clientOptions` | Whenever an SDK client is built | Adjusts the client options after flags, environment variables and the stored sign-in were resolved, in generated commands and in `ctx.client()`. A credential that arrives as `null` belongs to a security scheme the caller did not select: it stays unset whatever the hook returns. |

### Default values

`cli.flagDefaults` returns defaults keyed by command path, then by input. A default never overrides what the caller gave:

- A flag typed before or after the command name wins, and a repeatable flag is never added to.
- A client option whose environment variable is exported keeps that value.
- A body piped on stdin wins over a default for the same field.
- An object input is taken whole from one source. If the caller supplies any part of it (`--address.city`, the `--address` JSON flag, or the field in a piped body), a default for another part of the same object (`address.zip`) is not merged in, the same way a typed flag replaces a piped object rather than merging with it.
- A positional is filled only when it was not typed. On a `.passthrough()` command, only the words before `--` count.

A default is parsed as a typed value would be, so `"5"` reaches an option declared with `parseInteger` as `5`, and a value the parser rejects is a usage error. A switch takes `true` or `false`, and a negated one such as `--no-sort` is set through its value's key: `{ sort: false }`.

Hooks see credentials, so treat what they receive as secret before logging any of it. The options a `cli.clientOptions` hook receives hold the credentials the CLI resolved, including a token exported in an environment variable. `ctx.globals` holds every flag the caller typed, credential flags among them. For the flags that decide where a request goes and how it is sent (`--base-url`, `--environment`, `--timeout`, `--max-retries`, `--debug`), `ctx.globals` reads exactly what the request uses, so a hook can gate on them. The message of an error an `onError` hook throws is printed as it is. A `cli.clientOptions` hook must return the options: one that returns nothing fails the command with an error naming the hook.

A default cannot supply a credential or a secret flag; use `cli.clientOptions` or the sign-in for those. Nor can it set the CLI's own `--base-url`, `--environment`, `--yes`, `--no-input` or `--debug`: the server, and the sign-in that goes with it, comes from what the caller typed or exported; `--yes` answers a confirmation; and the last two are read before any default applies. An option of the command's own with one of those names, a custom option or a flag generated from the API, is not affected. A path that is not a command, or an input the command does not have, is a usage error (exit 2). The inputs of generated commands are type-checked: their flags, their client options that carry no credential, and global flags such as `--format` and `--timeout`. `--debug` prints each value a default applied and the hook it came from.

## What generation checks

The generator never parses or runs your code while it compiles your API. Before it writes the CLI, it builds and runs a temporary copy of it in separate processes, and fails generation if any step fails:

1. Install the dependencies, your `dependencies` included.
2. Run the CLI's build. Its `tsc` type-checks every custom file except tests.
3. Import the compiled custom-code file in a fresh process.
4. List the command tree the CLI now has, and run `--help` for the program and for each custom command.

The help, man pages, README, `SKILL.md` and shell completions are then rendered from that live tree, so custom commands are documented beside the generated ones.

Nothing is written to the CLI repository until every step has passed, so a failing build leaves the repository as it was. The copy installs with the lockfile and package-manager config (`.npmrc`, `.yarnrc.yml`, `bunfig.toml`, `pnpm-workspace.yaml`) the repository holds, along with a committed Yarn release and plugins (`.yarn/releases`, `.yarn/plugins`) and patches (`.yarn/patches`, `patches/`). A file those configs name anywhere else, such as an `.npmrc` `cafile`, is not copied. The copy updates a lockfile that a new dependency made stale only there: refresh the repository's own after the run. The copy is deleted afterwards: the generator writes the CLI's sources and leaves installing and building them to the repository's own tooling.

The command tree is recorded in `scalar-sdk.cli-context.json`, beside the manifest, with a hash of everything the build read: the generated sources, your custom files, the dependency constraints, and the repository's lockfile and package-manager config. Commit it with the rest of the build. A later run with the same inputs renders from the recorded tree and skips the install and the build. Without a lockfile, delete the file to build again against a newly published version of a dependency.

For a single run, `scalar-sdk-generator generate --custom-code <dir>` reads the custom folder from `<dir>` instead of `dir`. It is copied into the CLI repository's `custom/` as `dir` is.

With `dir` or `--custom-code`, the manifest records a hash of each copied file. `generate --check` compares the CLI repository's `custom/` against it and reports an edit made to the copy, which the next build would undo. Edit the folder `dir` or `--custom-code` names instead.
