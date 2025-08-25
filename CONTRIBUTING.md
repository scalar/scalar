# Contributing

Contributions are welcome. We're using [pnpm](https://pnpm.io/).

## Development setup

1. Clone the repository: `$ git clone git@github.com:scalar/scalar.git`
2. Install all dependencies: `$ pnpm install`
3. Build all packages once: `$ pnpm turbo build`
4. Run the development server: `$ pnpm run dev`
5. Open your browser: <http://localhost:5050>

This should give you a nice start page with entrypoints to the various previews and examples.

### Quick start Development Scripts

These scripts use [`turbo`](https://turbo.build/) to build all the dependencies and run a development server.

| Command                    | Description                                                               |
| -------------------------- | ------------------------------------------------------------------------- |
| `pnpm dev`                 | Runs all package `pnpm dev` commands (slow)                               |
| `pnpm dev:client`          | Runs the API Client dev environment                                       |
| `pnpm dev:client:desktop`  | Runs the API Client desktop app in an electron dev environment            |
| `pnpm dev:client:app`      | Runs the API Client desktop app in a browser dev environment (with HMR\*) |
| `pnpm dev:client:modal`    | Runs the API Client modal layout (with HMR\*)                             |
| `pnpm dev:client:web`      | Runs the API Client client web app (with HMR\*)                           |
| `pnpm dev:components`      | Runs storybook for `@scalar/components`                                   |
| `pnpm dev:nuxt`            | Runs the [Nuxt](https://nuxt.com/) package                                |
| `pnpm dev:proxy-server`    | Runs the Scalar proxy server locally                                      |
| `pnpm dev:reference`       | Runs the API References dev environment (with HMR\*)                      |
| `pnpm dev:reference:react` | Runs the API References React playground                                  |
| `pnpm dev:void-server`     | Runs the Scalar void server locally                                       |
| `pnpm dev:web`             | Runs the web examples in `examples/web`                                   |

\* Hot module replacement and file watching only works for the main package being worked on, e.g. changes to `@scalar/api-client` if you're running `pnpm dev:client:app` or `@scalar/api-reference` if you're running `pnpm dev:reference`

## GitHub Codespaces & Devcontainers

We support development using [GitHub Codespaces](https://github.com/features/codespaces) and [devcontainers](https://containers.dev/). This allows you to get started quickly in a cloud-based or local containerized environment without the need to install dependencies locally.

To set up a Codespace, click the green "Code" button on the repository page and select "Create codespace on main".

To work with devcontainers in VS Code, open the repository folder and select "Reopen in Container" from the command palette (requires the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) to be installed).

**Note:** Codespaces may incur costs depending on your usage and GitHub plan.  
**Current limitation:** Only the Node.js stack is supported in our devcontainer setup.

For more details, see the `.devcontainer` folder in the repository.

## Tests

Most packages have a bunch of tests, mostly for all the helper functions we use.

It's worth to check the tests locally before sending contributions: `$ pnpm test`

If you want to add a test and only run your test file, you can filter the test suite like this: `$ pnpm test your-test`

Some tests require an instance of `@scalar/proxy-server` and `@scalar/void-server`. Start them like so:

```bash
pnpm dev:void-server
pnpm dev:proxy-server
```
## PRs

Don't worry, we'll help you to get your PR in. But here is how you can help us:

### Semantic PR titles

We require a semantic PR title, here is an example:

```
docs: Add information about semantic commits
^     ^
|     |__ Subject
|________ Prefix
```

Here are all the prefixes you need to know:

| Prefix   | Description                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| feat     | A new feature                                                                                               |
| fix      | A bug fix                                                                                                   |
| docs     | Documentation only changes                                                                                  |
| style    | Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)      |
| refactor | A code change that neither fixes a bug nor adds a feature                                                   |
| perf     | A code change that improves performance                                                                     |
| test     | Adding missing tests or correcting existing tests                                                           |
| build    | Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)         |
| ci       | Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs) |
| chore    | Other changes that don't modify src or test files                                                           |
| revert   | Reverts a previous commit                                                                                   |

### Changesets

If your PR will cause a version bump for any package, you will need to include a [changeset](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md) by running `pnpm changeset`.

## Styles and CSS Layers

The Scalar packages use CSS cascade layers extensively to manage the priority of exported styles and to make it easy to override themes and component styles in projects consuming those packages.

For more information see the [@scalar/themes](./packages/themes/) package.
