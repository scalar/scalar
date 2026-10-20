# Agent Pricing

Agent usage draws from your team's shared credit allowance. Docs and API chat, token-based agent features, and successful API MCP tool calls all contribute to that usage. See [Scalar pricing](../pricing.md) for plan prices and included product features.

## Included credits

| Plan       | Monthly included credits |
| ---------- | ------------------------ |
| Free       | 50                       |
| Pro        | 500                      |
| Business   | 2,000                    |
| Enterprise | Set by your agreement    |

Your team's allowance may differ if it has a custom agreement or credit override. Check the dashboard's billing usage for your team's allowance and consumption.

## What consumes a credit?

| Usage                      | Credit conversion                        |
| -------------------------- | ---------------------------------------- |
| Docs or API chat           | 2 messages per credit                    |
| API MCP                    | 200 successful tool calls per credit     |
| Token-based agent features | 50,000 reference-model tokens per credit |

Documentation search and read tools do not incur MCP tool-call charges. Failed API tool calls are not billed.

A feature uses its own billing unit; a Docs chat message is not also charged as token usage. Token-based features count input and output tokens equally, with a model multiplier: Haiku uses the reference rate, Sonnet uses 3×, and Opus uses 5×. The 50,000-token figure is the reference rate, not an allowance that applies equally to every model.

For example, 100 Docs chat messages consume 50 credits, and 10,000 MCP tool calls consume another 50 credits. Together they consume 100 credits from the team's allowance.

## Overage and billing periods

For paid subscriptions, usage above the included allowance is charged at **$0.057 per credit**. Paid usage continues beyond the allowance. Free and trial chat and API MCP tool usage stop when the included credit limit is reached. Documentation search and read tools are not subject to that MCP credit cap.

Usage billing is monthly, including on yearly subscriptions. A yearly subscription keeps its annual base-plan renewal and receives monthly usage billing; it does not provide a single annual pool of credits. Included credits reset each monthly usage period and do not roll over. For paid subscriptions, the usage billing period follows the subscription's monthly usage cycle rather than necessarily the calendar month.

Check your billing page and agreement for account-specific terms, including legacy subscriptions being migrated to the current pricing model.

## Team seats

Current flat-price plans include editor seats, and viewer seats are unlimited. Inviting a viewer does not add a billable editor seat. Check [Scalar pricing](../pricing.md) for editor allowances and your billing page for any legacy or custom subscription terms.

## Local development

Anonymous local development retains a small trial allowance without an Agent key. That allowance is separate from a team's monthly credits. For production setup, see [Agent in API Reference](api-reference.md) and [Agent Keys](key.md).

## Review or reduce usage

Review usage in the dashboard's billing section. To turn off chat in an API reference, see [Disabling Agent](api-reference.md#disabling-agent). Disabling that chat does not disable a separately configured MCP server.
