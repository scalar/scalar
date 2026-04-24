# Agent Skills

You can install a reusable Mock Server skill for coding agents with the [`skills`](https://www.npmjs.com/package/skills) CLI.

## Install the Mock Server skill

Install directly from GitHub:

```bash
npx skills add scalar/scalar --skill mock-server
```

## Install to specific agents

Example for Cursor and Codex:

```bash
npx skills add scalar/scalar \
  --skill mock-server \
  --agent cursor \
  --agent codex
```

## Install alongside Scalar Docs

If you also manage `scalar.config.json`, install both skills:

```bash
npx skills add scalar/scalar --skill scalar-docs
npx skills add scalar/scalar --skill mock-server
```

## Install globally

To make the skill available across projects:

```bash
npx skills add scalar/scalar --skill mock-server --global
```

## Use Scalar Docs as an MCP

Use `https://scalar.com/mcp` to add Scalar Documentation as an MCP server for your agent.

## What this skill covers

The `mock-server` skill includes guidance for:

- Setting up `createMockServer()` with `document` and `onRequest`
- Using `x-handler` for dynamic request handling
- Using `x-seed` for startup data seeding
- Working with authentication in OpenAPI operations
- Running and troubleshooting `@scalar/mock-server` with Docker
