# Stakeholder Digest

This cookbook builds a background agent that runs every Monday morning, pulls the past week's Jira activity, and emails a plain-English summary to stakeholders who don't live in Jira. No dashboards to build, no reports to format — the agent reads the tickets and writes the email.

## Prerequisites

- Node.js 18+ (TypeScript) **or** Python 3.10+ (Python)
- [Scalar personal token](https://dashboard.scalar.com/account) and installation ID
- OpenAI API key
- Jira account with API access
- Resend account with a verified sending domain

## Project setup

### TypeScript

```bash
mkdir stakeholder-digest && cd stakeholder-digest
npm init -y
npm install @scalar/agent ai @ai-sdk/openai dotenv tsx
```

### Python

Uses the OpenAI Agents SDK with [`scalar-agent`](../sdk.md#python).

```bash
mkdir stakeholder-digest && cd stakeholder-digest
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

1. **Jira** — Add tool, paste your Jira API token, enable **Execute** on `GET /rest/api/3/search`. Leave everything else on **Search** only — this agent only needs to read.
2. **Resend** — Add tool, paste your Resend API key, enable **Execute** on `POST /emails`.
3. Copy your **Installation ID** from the SDK tab.

## The digest

### TypeScript

```ts
import 'dotenv/config'
import { agentScalar } from '@scalar/agent'
import { generateText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'

const scalar = agentScalar({ token: process.env.SCALAR_TOKEN })
const model = openai('gpt-4o')

async function digest() {
  const installation = await scalar.installation(process.env.SCALAR_INSTALLATION_ID)
  const tools = await installation.createVercelAITools()

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { text } = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(15),
    system: `You are a project communications assistant with access to Jira and Resend.
Summarize Jira activity in plain English — no jargon, no ticket IDs in the subject.
Write for a business audience, not engineers. Today is ${new Date().toISOString().split('T')[0]}.`,
    prompt: `Generate and send a weekly stakeholder digest:

1. Search Jira for issues updated in the last 7 days (since ${oneWeekAgo})
   in project YOUR_PROJECT_KEY.

2. Summarize into three sections:
   - Completed this week (status moved to Done)
   - In progress (status = In Progress)
   - Blocked or at risk (priority = High or Critical and not Done)

3. Send the digest via Resend:
   - From: updates@yourcompany.com
   - To: cto@yourcompany.com, vp-ops@yourcompany.com
   - Subject: Weekly Engineering Update — [date]
   - Body: the plain-English summary, formatted cleanly

Keep the summary concise — 3 to 5 bullet points per section maximum.`,
  })

  console.log(text)
}

digest()
```

### Python

`digest.py`

```python
import asyncio
import os
from datetime import date, datetime, timedelta, timezone

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

    one_week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    today = date.today().isoformat()

    agent = Agent(
        name="stakeholder-digest",
        instructions=(
            "You are a project communications assistant with access to Jira and Resend.\n"
            "Summarize Jira activity in plain English — no jargon, no ticket IDs in the subject.\n"
            "Write for a business audience, not engineers.\n"
            f"Today is {today}."
        ),
        mcp_servers=[server],
    )

    result = await Runner.run(
        agent,
        f"""Generate and send a weekly stakeholder digest:

1. Search Jira for issues updated in the last 7 days (since {one_week_ago})
   in project YOUR_PROJECT_KEY.

2. Summarize into three sections:
   - Completed this week (status moved to Done)
   - In progress (status = In Progress)
   - Blocked or at risk (priority = High or Critical and not Done)

3. Send the digest via Resend:
   - From: updates@yourcompany.com
   - To: cto@yourcompany.com, vp-ops@yourcompany.com
   - Subject: Weekly Engineering Update — [date]
   - Body: the plain-English summary, formatted cleanly

Keep the summary concise — 3 to 5 bullet points per section maximum.""",
        max_turns=15,
    )
    print(result.final_output)
    await server.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
```

## Running the digest

```bash
npx tsx digest.ts
# or
python digest.py
```

Example output:

```
Fetched 34 Jira issues updated in the last 7 days.

Digest sent to cto@yourcompany.com and vp-ops@yourcompany.com.

Subject: Weekly Engineering Update — April 5, 2026

Completed this week:
- Shipped the new checkout flow for mobile (ahead of schedule)
- Fixed the EU region dashboard outage affecting ~200 users
- Completed security audit for the payments module

In progress:
- API performance improvements — targeting 40% latency reduction
- Migrating legacy auth system to OAuth 2.0 (60% complete)

Blocked or at risk:
- Data export feature delayed — waiting on legal review
- On-call rotation understaffed next week
```

## Running on a schedule

### crontab (every Monday at 8am)

```bash
crontab -e
```

```
0 8 * * 1 cd /path/to/stakeholder-digest && npx tsx digest.ts >> digest.log 2>&1
# Python: 0 8 * * 1 cd /path/to/stakeholder-digest && .venv/bin/python digest.py >> digest.log 2>&1
```

### GitHub Actions

`.github/workflows/stakeholder-digest.yml`

```yaml
name: Stakeholder Digest
on:
  schedule:
    - cron: '0 8 * * 1' # 8am UTC every Monday
  workflow_dispatch:

jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npx tsx digest.ts
        env:
          SCALAR_TOKEN: ${{ secrets.SCALAR_TOKEN }}
          SCALAR_INSTALLATION_ID: ${{ secrets.SCALAR_INSTALLATION_ID }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

`.github/workflows/stakeholder-digest-python.yml`

```yaml
name: Stakeholder Digest (Python)
on:
  schedule:
    - cron: '0 8 * * 1'
  workflow_dispatch:

jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install "scalar-agent[openai]" python-dotenv
      - run: python digest.py
        env:
          SCALAR_TOKEN: ${{ secrets.SCALAR_TOKEN }}
          SCALAR_INSTALLATION_ID: ${{ secrets.SCALAR_INSTALLATION_ID }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Take it further

- **Multiple projects** — extend the Jira search across several project keys for a cross-team digest
- **Discord** — post the same summary to a #weekly-update channel alongside the email
- **Notion** — archive each week's digest as a Notion page for a running history
