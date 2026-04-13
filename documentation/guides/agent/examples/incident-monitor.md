# Incident Monitor

This cookbook builds a background agent that watches Jira for new high-priority tickets and posts a formatted alert to a Discord channel. No more manually copying ticket details into chat — the agent catches new incidents and notifies your team automatically.

Run it on a cron every 15 minutes or trigger it from a Jira webhook.

## Prerequisites

- Node.js 18+ (TypeScript) **or** Python 3.10+ (Python)
- [Scalar personal token](https://dashboard.scalar.com/account) and installation ID
- OpenAI API key
- Jira account with API access
- Discord server with a webhook URL for your target channel

## Project setup

### TypeScript

```bash
mkdir incident-monitor && cd incident-monitor
npm init -y
npm install @scalar/agent ai @ai-sdk/openai dotenv tsx
```

### Python

Uses the OpenAI Agents SDK with [`scalar-agent`](../sdk.md#python).

```bash
mkdir incident-monitor && cd incident-monitor
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install "scalar-agent[openai]" python-dotenv
```

Add your keys to a `.env` file:

```bash
SCALAR_TOKEN=your-scalar-personal-token
SCALAR_INSTALLATION_ID=your-installation-id
OPENAI_API_KEY=your-openai-api-key
```

## Setting up your Scalar MCP

In [dashboard.scalar.com](https://dashboard.scalar.com):

1. Go to **MCP → + Add tool → Jira**. Under **Authentication** paste your Jira API token and click **Save**. Enable **Execute** on `GET /rest/api/3/search`.
2. Click **+ Add tool → Discord**. Paste your Discord bot token and click **Save**. Enable **Execute** on `POST /channels/{channel.id}/messages`.
3. Copy your **Installation ID** from the SDK tab.

## Initializing the client

### TypeScript

```ts
import 'dotenv/config'
import { agentScalar } from '@scalar/agent'
import { generateText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'

const scalar = agentScalar({ token: process.env.SCALAR_TOKEN })
const model = openai('gpt-4o')
```

### Python

```python
import os

from dotenv import load_dotenv
from scalar_agent import agent_scalar

load_dotenv()

scalar = agent_scalar(token=os.environ["SCALAR_TOKEN"])
```

## The monitor

The agent searches Jira for tickets created in the last 15 minutes with a priority of High or Critical, then posts a summary of each to Discord. It only acts when there's something to report.

### TypeScript

```ts
async function monitor() {
  const installation = await scalar.installation(process.env.SCALAR_INSTALLATION_ID)
  const tools = await installation.createVercelAITools()

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

  const { text } = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(10),
    system: `You are an incident monitor with access to Jira and Discord.
Search Jira for new high-priority issues. Post alerts to Discord.
Current time: ${new Date().toISOString()}`,
    prompt: `Check for new incidents:

1. Search Jira for issues created after ${fifteenMinutesAgo} 
   with priority = High or Critical.

2. If any are found, post one message per issue to Discord channel ID 
   YOUR_CHANNEL_ID in this format:

   🚨 [PRIORITY] — [ISSUE KEY]: [SUMMARY]
   Assignee: [assignee or Unassigned]
   Project: [project name]
   Link: [issue URL]

3. If no issues are found, do nothing.`,
  })

  console.log(text)
}

monitor()
```

### Python

```python
import asyncio
import os
from datetime import datetime, timedelta, timezone

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

async def monitor() -> None:
    installation = scalar.installation(os.environ["SCALAR_INSTALLATION_ID"])
    server = MCPServerStreamableHttp(**installation.create_openai_mcp())
    await server.connect()

    fifteen_minutes_ago = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
    now = datetime.now(timezone.utc).isoformat()

    agent = Agent(
        name="incident-monitor",
        instructions=(
            "You are an incident monitor with access to Jira and Discord.\n"
            "Search Jira for new high-priority issues. Post alerts to Discord.\n"
            f"Current time: {now}"
        ),
        mcp_servers=[server],
    )

    result = await Runner.run(
        agent,
        f"""Check for new incidents:

1. Search Jira for issues created after {fifteen_minutes_ago}
   with priority = High or Critical.

2. If any are found, post one message per issue to Discord channel ID
   YOUR_CHANNEL_ID in this format:

   🚨 [PRIORITY] — [ISSUE KEY]: [SUMMARY]
   Assignee: [assignee or Unassigned]
   Project: [project name]
   Link: [issue URL]

3. If no issues are found, do nothing.""",
        max_turns=10,
    )
    print(result.final_output)
    await server.cleanup()


asyncio.run(monitor())
```

## Complete script

### TypeScript

`monitor.ts`

```ts
import 'dotenv/config'
import { agentScalar } from '@scalar/agent'
import { generateText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'

const scalar = agentScalar({ token: process.env.SCALAR_TOKEN })
const model = openai('gpt-4o')

async function monitor() {
  const installation = await scalar.installation(process.env.SCALAR_INSTALLATION_ID)
  const tools = await installation.createVercelAITools()

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

  const { text } = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(10),
    system: `You are an incident monitor with access to Jira and Discord.
Search Jira for new high-priority issues. Post alerts to Discord.
Current time: ${new Date().toISOString()}`,
    prompt: `Check for new incidents:

1. Search Jira for issues created after ${fifteenMinutesAgo}
   with priority = High or Critical.

2. If any are found, post one message per issue to Discord channel ID
   YOUR_CHANNEL_ID in this format:

   🚨 [PRIORITY] — [ISSUE KEY]: [SUMMARY]
   Assignee: [assignee or Unassigned]
   Project: [project name]
   Link: [issue URL]

3. If no issues are found, do nothing.`,
  })

  console.log(text)
}

monitor()
```

### Python

`monitor.py`

```python
import asyncio
import os
from datetime import datetime, timedelta, timezone

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp
from dotenv import load_dotenv
from scalar_agent import agent_scalar

load_dotenv()


async def main() -> None:
    scalar = agent_scalar(token=os.environ["SCALAR_TOKEN"])
    installation = scalar.installation(os.environ["SCALAR_INSTALLATION_ID"])
    server = MCPServerStreamableHttp(**installation.create_openai_mcp())
    await server.connect()

    fifteen_minutes_ago = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
    now = datetime.now(timezone.utc).isoformat()

    agent = Agent(
        name="incident-monitor",
        instructions=(
            "You are an incident monitor with access to Jira and Discord.\n"
            "Search Jira for new high-priority issues. Post alerts to Discord.\n"
            f"Current time: {now}"
        ),
        mcp_servers=[server],
    )

    result = await Runner.run(
        agent,
        f"""Check for new incidents:

1. Search Jira for issues created after {fifteen_minutes_ago}
   with priority = High or Critical.

2. If any are found, post one message per issue to Discord channel ID
   YOUR_CHANNEL_ID in this format:

   🚨 [PRIORITY] — [ISSUE KEY]: [SUMMARY]
   Assignee: [assignee or Unassigned]
   Project: [project name]
   Link: [issue URL]

3. If no issues are found, do nothing.""",
        max_turns=10,
    )
    print(result.final_output)
    await server.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
```

## Running the monitor

```bash
npx tsx monitor.ts
# or
python monitor.py
```

Example output:

```
Found 2 new high-priority issues in Jira:

Posted to #incidents:
🚨 Critical — OPS-1842: API timeout on large payload uploads
Assignee: Sarah Chen
Project: Platform Operations
Link: https://yourorg.atlassian.net/browse/OPS-1842

🚨 High — OPS-1843: Dashboard failing to load for EU region
Assignee: Unassigned
Project: Platform Operations
Link: https://yourorg.atlassian.net/browse/OPS-1843
```

## Running on a schedule

### crontab (every 15 minutes)

```bash
crontab -e
```

```
*/15 * * * * cd /path/to/incident-monitor && npx tsx monitor.ts >> monitor.log 2>&1
# Python: */15 * * * * cd /path/to/incident-monitor && .venv/bin/python monitor.py >> monitor.log 2>&1
```

### GitHub Actions

`.github/workflows/incident-monitor.yml`

```yaml
name: Incident Monitor
on:
  schedule:
    - cron: '*/15 * * * *' # every 15 minutes
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npx tsx monitor.ts
        env:
          SCALAR_TOKEN: ${{ secrets.SCALAR_TOKEN }}
          SCALAR_INSTALLATION_ID: ${{ secrets.SCALAR_INSTALLATION_ID }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

`.github/workflows/incident-monitor-python.yml`

```yaml
name: Incident Monitor (Python)
on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install "scalar-agent[openai]" python-dotenv
      - run: python monitor.py
        env:
          SCALAR_TOKEN: ${{ secrets.SCALAR_TOKEN }}
          SCALAR_INSTALLATION_ID: ${{ secrets.SCALAR_INSTALLATION_ID }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Take it further

- **Add Resend** — for Critical priority tickets, also email the on-call engineer directly
- **Filter by project** — scope the Jira search to a specific project key so you only alert on what matters
- **Resolution alerts** — run a second sweep for issues that moved to Done and post a resolution message to Discord
