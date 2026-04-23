# Agent Skills

You can install a reusable Scalar Docs skill for coding agents with the [`skills`](https://www.npmjs.com/package/skills) CLI.

## Install the Scalar Docs skill

Install directly from GitHub:

```bash
npx skills add scalar/scalar --skill scalar-docs
```

## Install to specific agents

Example for Cursor and Codex:

```bash
npx skills add scalar/scalar \
  --skill scalar-docs \
  --agent cursor \
  --agent codex
```

## Install globally

To make the skill available across projects:

```bash
npx skills add scalar/scalar --skill scalar-docs --global
```

## MCP: Scalar Documentation

Use `https://scalar.com/mcp` to add Scalar Documentation as an MCP server in your agent tooling.
