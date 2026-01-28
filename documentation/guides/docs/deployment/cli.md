# CLI

Publish your Scalar Docs project using the Scalar CLI. The CLI uploads your project configuration and content to Scalar's platform, making your documentation available at a custom domain.

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
scalar project create --name "My Documentation" --slug my-docs
```

| Option   | Type     | Required | Description                     |
| -------- | -------- | -------- | ------------------------------- |
| `--name` | `string` | No       | Display name for your project   |
| `--slug` | `string` | No       | URL-friendly project identifier |

## Preview

Preview your documentation locally before publishing:

```bash
scalar project preview
```

## Publishing

Publish your project to make it live:

```bash
scalar project publish
```

Specify a project slug and config file:

```bash
scalar project publish --slug my-docs --config scalar.config.json
```

| Option     | Type     | Required | Description                          |
| ---------- | -------- | -------- | ------------------------------------ |
| `--slug`   | `string` | No       | Project slug identifier              |
| `--config` | `string` | No       | Path to your scalar.config.json file |

The publish command uploads your project configuration and all referenced content files to Scalar's platform.

Your documentation will be available at `https://your-subdomain.apidocumentation.com`.
