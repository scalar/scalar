# Agent Skills

You can install a reusable Scalar Docs skill for coding agents with the [`skills`](https://www.npmjs.com/package/skills) CLI.

## Install the Scalar Docs skill

Install directly from GitHub:

```bash
npx skills add scalar/scalar --skill scalar-docs
```

If you are in a local clone of this repository, you can install from the current directory:

```bash
npx skills add . --skill scalar-docs
```

## Verify available Scalar skills

List all skills exposed by this repository:

```bash
npx skills add scalar/scalar --list
```

You should see `scalar-docs` in the available skill list.

## Install to specific agents

Example for Cursor and Codex:

```bash
npx skills add scalar/scalar --skill scalar-docs --agent cursor --agent codex
```

## Install globally

To make the skill available across projects:

```bash
npx skills add scalar/scalar --skill scalar-docs --global
```
