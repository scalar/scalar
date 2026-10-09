# CLI

Publish your Docs project using the Scalar CLI. The CLI uploads your project configuration and content to Scalar's platform, making your documentation available at a custom domain.

## Deployment modes

`scalar project publish` supports two ways to deploy:

- **Default:** The CLI uploads your project configuration and content from your local machine to Scalar. What you have on disk is what gets deployed.
- **With `--github`:** Use only when your Docs project is connected to a GitHub repository. Scalar pulls the files from GitHub and deploys that. Local changes are ignored. Use this to trigger a deploy from the linked repository.

## Installation

Install the [Scalar CLI](../../cli/getting-started.md) globally or use it via npx. The CLI requires Node.js 24 or later.

```bash
npm install -g @scalar/cli
```

Or use npx without installation:

```bash
npx @scalar/cli project publish --slug your-docs
```

## Authentication

Authenticate with the Scalar platform before publishing:

```bash
scalar auth login
```

This opens a browser to sign in. In CI or on a remote machine, use a personal token instead. Create one in the [dashboard](https://dashboard.scalar.com/account) under **Account > API Keys**:

```bash
scalar auth login --token your-personal-token
```

You can also set `SCALAR_API_KEY` and run `scalar auth login`. In CI, always use a token: without one, the CLI waits up to three minutes for a browser sign-in and then fails.

Verify your current authentication status:

```bash
scalar auth whoami
```

## Project Setup

### Initialize Configuration

Create a `scalar.config.json` file in your project root:

```bash
scalar project init
```

This command prompts for a subdomain and creates the configuration file.

### Create Project

Create a new project on the Scalar platform:

```bash
scalar project create --name "My Documentation" --slug your-docs
```

| Option   | Type     | Required | Description                     |
| -------- | -------- | -------- | ------------------------------- |
| `--name` | `string` | Yes, outside an interactive terminal | Display name for your project |
| `--slug` | `string` | No       | URL-friendly project identifier |

## Local Preview

Preview your documentation locally before publishing:

```bash
scalar project preview
```

## Preview Deployments

Publish in preview mode (e.g. for pull requests) without going live:

```bash
scalar project publish --slug your-docs --preview
```

## Publishing

### Publish from local files

Publish your project by uploading it directly from your machine. Pass the project slug, which you can find with `scalar project list`:

```bash
scalar project publish --slug your-docs
```

If your config file is not in the current folder, point to it with `--config`:

```bash
scalar project publish --slug your-docs --config path/to/scalar.config.json
```

### Publish from GitHub

If your project is connected to a GitHub repository, you can deploy from the remote repo instead. Scalar pulls the files from GitHub; local changes are ignored.

```bash
scalar project publish --slug your-docs --github
```

### Options

| Option      | Type      | Required | Description                                                                                             |
| ----------- | --------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `--slug`    | `string`  | Yes      | Project slug. Find it with `scalar project list`.                                                       |
| `--config`  | `string`  | No       | Path to your scalar.config.json file                                                                    |
| `--preview` | `boolean` | No       | Publish in preview mode (do not go live)                                                                |
| `--github`  | `boolean` | No       | Publish from the project's linked GitHub repository (Scalar pulls from GitHub; local files are ignored) |

Use `project publish` for ad-hoc or local-first workflows. Use `project publish --github` when the project is connected to GitHub and you want the deployment to reflect the remote repository.

Your documentation will be available at `https://your-subdomain.apidocumentation.com`.

## Rollback

If a deployment introduced a problem, you can roll the live deployment back to a previously deployed build. List recent production deployments to find the build you want, then roll back to the previous build (or pass `--to <build-id>` to target a specific one).

```bash
# See recent production deployments
scalar project deployments list --slug your-docs

# Roll back to the previous build (or pass --to <build-id>)
scalar project rollback --slug your-docs
```
