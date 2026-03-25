# Too Long; Didn't Read; Used MCP

Hey, it's 2026, who does even **read** the documentation for your API anymore. Just boot up a MCP based on your OpenAPI document (using Scalar), and share it with your users or your team[1].

And then enhance any trillion dollar frontier model with your MCP server, that has all the context of how your API is defined. We show exactly how in the UI.

If you want to add our Scalar Galaxy example, hack this into your terminal:

```bash
npx add-mcp https://mcp.scalar.com/mcp/67f954ca-123c-423b-b601-7284cfac3aff
```

That's it? That's it. Open your thing and ask it something related to the API.

```
claude, give me the curl for creating a new planet, buddy
make no mistakes
```

Let it do its work…

```
⏺ Let me search the available APIs for a planet creation endpoint.

⏺ scalar-galaxy-mcp - search-openapi-operations (MCP)(question: "create a new planet")
```

… and you'll be amazed how accurate (and token-efficient and fast) it'll reply:

```
Here's your curl:

curl -X POST https://galaxy.scalar.com/planets \
  -H "Content-Type: application/json" \
  -d '{ … }'

Expects: 201 Created with the planet object (including a server-assigned id).

The only required field is name — everything else is optional.
```

(You can stop reading here, the following part is for all the great companies and enterprises using Scalar. Just open the dashboard and spin up your MCP in less than 60 seconds: https://dashboard.scalar.com, that's fine.)

But sometimes, you don't want to share the docs publicly, no matter if it's in the browser or the MCP server. Your internal APIs, the new APIs you're about to release, the staging APIs… No worries, we got you.

Set your MCP to "private" and share the URL with your team. They'll be able to authenticate using OAuth. Means their LLM will open a browser, where they can authenticate with Scalar to access your secret API (if they are on your team). Here's a video how easy this is:

<!-- Insert Video Here -->

This is how documentation works for everyone (agents).
