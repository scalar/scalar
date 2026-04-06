# Billing Sweep

This cookbook builds a background agent that runs a daily billing sweep. It checks Stripe for open invoices past their due date and sends a payment reminder to each customer via Resend. One script, two APIs, zero manual follow-up.

Run it manually, put it on a cron, or trigger it from a Stripe webhook.

## Prerequisites

- Node.js 18+ (TypeScript) **or** Python 3.10+ (Python)
- [Scalar personal token](https://dashboard.scalar.com/account) and installation ID
- OpenAI API key
- Stripe account (test mode is fine)
- Resend account with a verified sending domain

## Project setup

### TypeScript

```bash
mkdir billing-sweep && cd billing-sweep
npm init -y
npm install @scalar/agent ai @ai-sdk/openai dotenv tsx
```

### Python

Uses the OpenAI Agents SDK with [`scalar-agent`](../sdk.md#python) — same MCP installation as above.

```bash
mkdir billing-sweep && cd billing-sweep
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

1. Go to **MCP → + Add tool → Stripe**. Under **Authentication** paste your Stripe secret key and click **Save**. Enable **Execute** on `GET /v1/invoices`.
2. Click **+ Add tool → Resend**. Paste your Resend API key and click **Save**. Enable **Execute** on `POST /emails`.
3. Copy your **Installation ID** from the SDK tab.

Your API keys are stored in Scalar — they never appear in your code.

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

## The sweep

One function. Get the tools from your installation, pass them to `generateText`, and give the model a clear prompt. `stopWhen: stepCountIs(20)` lets the agent call as many tools as it needs across both APIs.

### TypeScript

```ts
async function sweep() {
  const installation = await scalar.installation(process.env.SCALAR_INSTALLATION_ID)
  const tools = await installation.createVercelAITools()

  const { text } = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(20),
    system: `You are a billing assistant with access to Stripe and Resend.
Use Stripe to read invoice data. Use Resend to send emails.
Today's date is ${new Date().toISOString().split('T')[0]}.`,
    prompt: `Run a billing sweep:

1. Fetch all open Stripe invoices where due_date is before today.
2. For each overdue invoice, send a payment reminder email via Resend.
   - From: billing@yourcompany.com
   - To: the customer_email on the invoice
   - Subject: Payment reminder — invoice #[number]
   - Body: friendly reminder with the amount due and hosted_invoice_url

3. Report how many invoices were found and how many emails were sent.`,
  })

  console.log(text)
}

sweep()
```

### Python

Connect with `MCPServerStreamableHttp`, then run the agent with `Runner.run`. `max_turns` bounds tool rounds similarly to `stepCountIs(20)`.

```python
import asyncio
import os
from datetime import date

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

async def sweep() -> None:
    installation = scalar.installation(os.environ["SCALAR_INSTALLATION_ID"])
    server = MCPServerStreamableHttp(**installation.create_openai_mcp())
    await server.connect()

    today = date.today().isoformat()
    agent = Agent(
        name="billing-sweep",
        instructions=(
            "You are a billing assistant with access to Stripe and Resend.\n"
            "Use Stripe to read invoice data. Use Resend to send emails.\n"
            f"Today's date is {today}."
        ),
        mcp_servers=[server],
    )

    result = await Runner.run(
        agent,
        """Run a billing sweep:

1. Fetch all open Stripe invoices where due_date is before today.
2. For each overdue invoice, send a payment reminder email via Resend.
   - From: billing@yourcompany.com
   - To: the customer_email on the invoice
   - Subject: Payment reminder — invoice #[number]
   - Body: friendly reminder with the amount due and hosted_invoice_url

3. Report how many invoices were found and how many emails were sent.""",
        max_turns=20,
    )
    print(result.final_output)
    await server.cleanup()


asyncio.run(sweep())
```

## Complete script

### TypeScript

`sweep.ts`

```ts
import 'dotenv/config'
import { agentScalar } from '@scalar/agent'
import { generateText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'

const scalar = agentScalar({ token: process.env.SCALAR_TOKEN })
const model = openai('gpt-4o')

async function sweep() {
  const installation = await scalar.installation(process.env.SCALAR_INSTALLATION_ID)
  const tools = await installation.createVercelAITools()

  const { text } = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(20),
    system: `You are a billing assistant with access to Stripe and Resend.
Use Stripe to read invoice data. Use Resend to send emails.
Today's date is ${new Date().toISOString().split('T')[0]}.`,
    prompt: `Run a billing sweep:

1. Fetch all open Stripe invoices where due_date is before today.
2. For each overdue invoice, send a payment reminder email via Resend.
   - From: billing@yourcompany.com
   - To: the customer_email on the invoice
   - Subject: Payment reminder — invoice #[number]
   - Body: friendly reminder with the amount due and hosted_invoice_url

3. Report how many invoices were found and how many emails were sent.`,
  })

  console.log(text)
}

sweep()
```

### Python

`sweep.py`

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
        name="billing-sweep",
        instructions=(
            "You are a billing assistant with access to Stripe and Resend.\n"
            "Use Stripe to read invoice data. Use Resend to send emails.\n"
            f"Today's date is {today}."
        ),
        mcp_servers=[server],
    )

    result = await Runner.run(
        agent,
        """Run a billing sweep:

1. Fetch all open Stripe invoices where due_date is before today.
2. For each overdue invoice, send a payment reminder email via Resend.
   - From: billing@yourcompany.com
   - To: the customer_email on the invoice
   - Subject: Payment reminder — invoice #[number]
   - Body: friendly reminder with the amount due and hosted_invoice_url

3. Report how many invoices were found and how many emails were sent.""",
        max_turns=20,
    )
    print(result.final_output)
    await server.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
```

## Running the sweep

```bash
npx tsx sweep.ts
# or
python sweep.py
```

Example output:

```
Found 3 overdue invoices in Stripe:

- jenny@acme.com — $240.00 — 12 days overdue → reminder sent
- ops@globex.com — $890.00 — 9 days overdue → reminder sent
- finance@initech.com — $120.00 — 3 days overdue → reminder sent

3 invoices found. 3 reminder emails sent via Resend.
```

## Running on a schedule

### crontab (every day at 9am)

```bash
crontab -e
```

```
0 9 * * * cd /path/to/billing-sweep && npx tsx sweep.ts >> sweep.log 2>&1
# Python: 0 9 * * * cd /path/to/billing-sweep && .venv/bin/python sweep.py >> sweep.log 2>&1
```

### GitHub Actions

`.github/workflows/billing-sweep.yml`

```yaml
name: Billing Sweep
on:
  schedule:
    - cron: '0 9 * * *' # 9am UTC daily
  workflow_dispatch: # manual trigger

jobs:
  sweep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npx tsx sweep.ts
        env:
          SCALAR_TOKEN: ${{ secrets.SCALAR_TOKEN }}
          SCALAR_INSTALLATION_ID: ${{ secrets.SCALAR_INSTALLATION_ID }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

`.github/workflows/billing-sweep-python.yml` (Python)

```yaml
name: Billing Sweep (Python)
on:
  schedule:
    - cron: '0 9 * * *'
  workflow_dispatch:

jobs:
  sweep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install "scalar-agent[openai]" python-dotenv
      - run: python sweep.py
        env:
          SCALAR_TOKEN: ${{ secrets.SCALAR_TOKEN }}
          SCALAR_INSTALLATION_ID: ${{ secrets.SCALAR_INSTALLATION_ID }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Take it further

- **Add Notion** — log every reminder sent to a Notion billing tracker so your finance team has a live view
- **Stripe webhook instead of cron** — trigger the agent on `invoice.payment_failed` for real-time reminders instead of daily sweeps
- **Escalation** — if an invoice is 30+ days overdue, create a Jira ticket for your accounts team instead of sending another email
