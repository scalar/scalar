# Revenue Dashboard

This cookbook builds a background agent that pulls Stripe billing data and syncs it into a Notion database. Finance and ops teams get a live revenue view without needing Stripe access. Run it every morning and your Notion page is always up to date.

## Prerequisites

- Node.js 18+ (TypeScript) **or** Python 3.10+ (Python)
- [Scalar personal token](https://dashboard.scalar.com/account) and installation ID
- OpenAI API key
- Stripe account
- Notion account with an integration token and a target database

## Project setup

### TypeScript

```bash
mkdir revenue-dashboard && cd revenue-dashboard
npm init -y
npm install @scalar/agent ai @ai-sdk/openai dotenv tsx
```

### Python

Uses the OpenAI Agents SDK with [`scalar-agent`](../sdk.md#python).

```bash
mkdir revenue-dashboard && cd revenue-dashboard
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

1. **Stripe** — Add tool, paste your Stripe secret key, enable **Execute** on `GET /v1/invoices` and `GET /v1/customers`. Set `GET /v1/invoices` to **Search** only if you want the agent to read but never modify.
2. **Notion** — Add tool, paste your Notion integration token, enable **Execute** on `POST /pages` (create rows) and `PATCH /pages/{page_id}` (update rows).
3. Copy your **Installation ID** from the SDK tab.

## Setting up your Notion database

Create a Notion database with these properties:

| Property | Type |
|---|---|
| Customer | Title |
| Email | Email |
| Amount Due | Number |
| Status | Select (open, paid, overdue) |
| Due Date | Date |
| Invoice URL | URL |
| Last Synced | Date |

Copy the database ID from the URL: `notion.so/your-workspace/[DATABASE_ID]?v=...`

## The sync

### TypeScript

```ts
import 'dotenv/config'
import { agentScalar } from '@scalar/agent'
import { generateText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'

const scalar = agentScalar({ token: process.env.SCALAR_TOKEN })
const model = openai('gpt-4o')

async function sync() {
  const installation = await scalar.installation(process.env.SCALAR_INSTALLATION_ID)
  const tools = await installation.createVercelAITools()

  const today = new Date().toISOString().split('T')[0]

  const { text } = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(30),
    system: `You are a finance assistant with access to Stripe and Notion.
Use Stripe to read billing data. Use Notion to write records.
Today is ${today}.`,
    prompt: `Sync Stripe billing data to Notion database YOUR_DATABASE_ID:

1. Fetch all Stripe invoices with status = open or paid, limit 50.
2. For each invoice, create or update a row in the Notion database with:
   - Customer: customer_name
   - Email: customer_email  
   - Amount Due: amount_due / 100 (convert from cents)
   - Status: "overdue" if due_date < today and status = open, otherwise use status
   - Due Date: due_date
   - Invoice URL: hosted_invoice_url
   - Last Synced: today

3. Report how many records were synced.`,
  })

  console.log(text)
}

sync()
```

### Python

```python
import asyncio
import os
from datetime import date

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp
from dotenv import load_dotenv
from scalar_agent import agent_scalar

load_dotenv()

scalar = agent_scalar(token=os.environ["SCALAR_TOKEN"])


async def sync() -> None:
    installation = scalar.installation(os.environ["SCALAR_INSTALLATION_ID"])
    server = MCPServerStreamableHttp(**installation.create_openai_mcp())
    await server.connect()

    today = date.today().isoformat()
    agent = Agent(
        name="revenue-sync",
        instructions=(
            "You are a finance assistant with access to Stripe and Notion.\n"
            "Use Stripe to read billing data. Use Notion to write records.\n"
            f"Today is {today}."
        ),
        mcp_servers=[server],
    )

    result = await Runner.run(
        agent,
        """Sync Stripe billing data to Notion database YOUR_DATABASE_ID:

1. Fetch all Stripe invoices with status = open or paid, limit 50.
2. For each invoice, create or update a row in the Notion database with:
   - Customer: customer_name
   - Email: customer_email
   - Amount Due: amount_due / 100 (convert from cents)
   - Status: "overdue" if due_date < today and status = open, otherwise use status
   - Due Date: due_date
   - Invoice URL: hosted_invoice_url
   - Last Synced: today

3. Report how many records were synced.""",
        max_turns=30,
    )
    print(result.final_output)
    await server.cleanup()


asyncio.run(sync())
```

## Complete script

### TypeScript

`sync.ts`

```ts
import 'dotenv/config'
import { agentScalar } from '@scalar/agent'
import { generateText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'

const scalar = agentScalar({ token: process.env.SCALAR_TOKEN })
const model = openai('gpt-4o')

async function sync() {
  const installation = await scalar.installation(process.env.SCALAR_INSTALLATION_ID)
  const tools = await installation.createVercelAITools()

  const today = new Date().toISOString().split('T')[0]

  const { text } = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(30),
    system: `You are a finance assistant with access to Stripe and Notion.
Use Stripe to read billing data. Use Notion to write records.
Today is ${today}.`,
    prompt: `Sync Stripe billing data to Notion database YOUR_DATABASE_ID:

1. Fetch all Stripe invoices with status = open or paid, limit 50.
2. For each invoice, create or update a row in the Notion database with:
   - Customer: customer_name
   - Email: customer_email
   - Amount Due: amount_due / 100 (convert from cents)
   - Status: "overdue" if due_date < today and status = open, otherwise use status
   - Due Date: due_date
   - Invoice URL: hosted_invoice_url
   - Last Synced: today

3. Report how many records were synced.`,
  })

  console.log(text)
}

sync()
```

### Python

`sync.py`

```python
import asyncio
import os
from datetime import date

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

    today = date.today().isoformat()
    agent = Agent(
        name="revenue-sync",
        instructions=(
            "You are a finance assistant with access to Stripe and Notion.\n"
            "Use Stripe to read billing data. Use Notion to write records.\n"
            f"Today is {today}."
        ),
        mcp_servers=[server],
    )

    result = await Runner.run(
        agent,
        """Sync Stripe billing data to Notion database YOUR_DATABASE_ID:

1. Fetch all Stripe invoices with status = open or paid, limit 50.
2. For each invoice, create or update a row in the Notion database with:
   - Customer: customer_name
   - Email: customer_email
   - Amount Due: amount_due / 100 (convert from cents)
   - Status: "overdue" if due_date < today and status = open, otherwise use status
   - Due Date: due_date
   - Invoice URL: hosted_invoice_url
   - Last Synced: today

3. Report how many records were synced.""",
        max_turns=30,
    )
    print(result.final_output)
    await server.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
```

## Running the sync

```bash
npx tsx sync.ts
# or
python sync.py
```

Example output:

```
Synced 12 invoices to Notion:

- Acme Corp — $4,200.00 — paid ✓
- Globex Inc — $890.00 — overdue (was due Apr 1) ✓
- Initech LLC — $1,200.00 — open (due Apr 15) ✓
- Umbrella Co — $6,500.00 — paid ✓
...

12 records synced to Notion database. Last synced: 2026-04-05.
```

## Running on a schedule

### crontab (every morning at 7am)

```bash
crontab -e
```

```
0 7 * * * cd /path/to/revenue-dashboard && npx tsx sync.ts >> sync.log 2>&1
# Python: 0 7 * * * cd /path/to/revenue-dashboard && .venv/bin/python sync.py >> sync.log 2>&1
```

### GitHub Actions

`.github/workflows/revenue-sync.yml`

```yaml
name: Revenue Dashboard Sync
on:
  schedule:
    - cron: '0 7 * * *' # 7am UTC daily
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npx tsx sync.ts
        env:
          SCALAR_TOKEN: ${{ secrets.SCALAR_TOKEN }}
          SCALAR_INSTALLATION_ID: ${{ secrets.SCALAR_INSTALLATION_ID }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

`.github/workflows/revenue-sync-python.yml`

```yaml
name: Revenue Dashboard Sync (Python)
on:
  schedule:
    - cron: '0 7 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install "scalar-agent[openai]" python-dotenv
      - run: python sync.py
        env:
          SCALAR_TOKEN: ${{ secrets.SCALAR_TOKEN }}
          SCALAR_INSTALLATION_ID: ${{ secrets.SCALAR_INSTALLATION_ID }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Take it further

- **Add Resend** — after syncing, email the finance team a summary of overdue accounts
- **Slack digest** — post a weekly revenue summary to a #finance channel every Monday
- **Failed payments** — add a separate Notion view that surfaces only failed/overdue invoices for accounts receivable
