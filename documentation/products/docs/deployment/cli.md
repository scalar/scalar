# CLI

Publish your Docs project using the Scalar CLI. The CLI uploads your project configuration and content to Scalar's platform, making your documentation available at a custom domain.

## Deployment modes

`scalar project publish` supports two ways to deploy:

- **Default:** The CLI uploads your project configuration and content from your local machine to Scalar. What you have on disk is what gets deployed.
- **With `--github`:** Use only when your Docs project is connected to a GitHub repository. Scalar pulls the files from GitHub and deploys that. Local changes are ignored. Use this to trigger a deploy from the linked repository.

## Installation

Install the [Scalar CLI](../../cli/getting-started.md) globally or use it via npx:

```bash
npm install -g @scalar/cli
```

Or use npx without installation:

```bash
npx @scalar/cli project publish
```

## Authentication

Authenticate with the Scalar platform before publishing:

```bash
scalar auth login
```

You can login with email and password, or [use a personal token](https://dashboard.scalar.com/user/api-keys):

```bash
scalar auth login --email your@email.com --password yourpassword
scalar auth login --token your-personal-token
```

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
| `--name` | `string` | No       | Display name for your project   |
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

Publish your project by uploading it directly from your machine:

```bash
scalar project publish
```

Specify a project slug and config file:

```bash
scalar project publish --slug your-docs --config scalar.config.json
```

### Publish from GitHub

If your project is connected to a GitHub repository, you can deploy from the remote repo instead. Scalar pulls the files from GitHub; local changes are ignored.

```bash
scalar project publish --github
```

### Options

| Option      | Type      | Required | Description                                                                                             |
| ----------- | --------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `--slug`    | `string`  | No       | Project slug identifier                                                                                 |
| `--config`  | `string`  | No       | Path to your scalar.config.json file                                                                    |
| `--preview` | `boolean` | No       | Publish in preview mode (do not go live)                                                                |
| `--github`  | `boolean` | No       | Publish from the project's linked GitHub repository (Scalar pulls from GitHub; local files are ignored) |

Use `project publish` for ad-hoc or local-first workflows. Use `project publish --github` when the project is connected to GitHub and you want the deployment to reflect the remote repository.

Your documentation will be available at `https://your-subdomain.apidocumentation.com`.
