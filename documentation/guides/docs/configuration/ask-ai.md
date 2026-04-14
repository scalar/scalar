# Ask AI

Ask AI adds an AI-powered assistant to your documentation site. The assistant searches across all your docs content, combines information from multiple pages, and returns a short, accurate answer.

Ask AI is enabled by default for all Scalar Docs projects. No setup required.

## How it works

When a user asks a question, Ask AI searches through all your published documentation. It can combine information from multiple sources to give a complete answer, even when the answer spans several pages.

## MCP integration

You can connect your docs AI to LLMs like Cursor, Claude Code, Windsurf, and other tools that support Model Context Protocol (MCP). This gives the LLM the full context of your documentation, so it can answer questions about your API and product without you copy-pasting docs into the chat.

Just add /mcp to your Scalar Docs domain.

### Cursor

Add the following to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "scalar-docs": {
      "url": "https://<your-domain>/mcp"
    }
  }
}
```

### Claude Code

Add the MCP server to your Claude Code configuration:

```sh
claude mcp add scalar-docs https://<your-domain>/mcp
```

### Other MCP clients

Any MCP-compatible client can connect to your docs AI. Point it to:

```
https://<your-domain>/mcp
```

## Configuration

You can configure Ask AI in the [Scalar Dashboard](https://dashboard.scalar.com). Navigate to your Docs project and open the settings to enable or disable the feature, or to adjust its behavior.

## Usage tracking

Track how users interact with Ask AI in the [Scalar Dashboard](https://dashboard.scalar.com). The dashboard shows the number of conversations, common questions, and usage trends over time.
