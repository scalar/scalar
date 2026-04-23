# Agent Skills

You can install reusable Scalar skills for coding agents with the [`skills`](https://www.npmjs.com/package/skills) CLI.

## Install available skills

Install directly from GitHub:

```bash
npx skills add scalar/scalar --skill scalar-docs
npx skills add scalar/scalar --skill mock-server
```

## Install to specific agents

Example for Cursor and Codex:

```bash
npx skills add scalar/scalar \
  --skill scalar-docs \
  --skill mock-server \
  --agent cursor \
  --agent codex
```

## Install globally

To make the skill available across projects:

```bash
npx skills add scalar/scalar --skill scalar-docs --global
npx skills add scalar/scalar --skill mock-server --global
```

## Skill reference

- `scalar-docs`: Helps agents write and update `scalar.config.json` for Scalar Docs projects.
- `mock-server`: Helps agents build and troubleshoot `@scalar/mock-server` setups, including `x-handler`, `x-seed`, authentication, and Docker.
