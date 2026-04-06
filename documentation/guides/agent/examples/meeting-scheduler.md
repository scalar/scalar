# Meeting Scheduler

This cookbook builds an agent that schedules a meeting end to end from a single prompt. It creates a Zoom meeting, adds it to Google Calendar, and sends a confirmation email with the Zoom link to all attendees via Resend. What normally takes five minutes of clicking across three tabs takes one prompt.

## Prerequisites

- Node.js 18+ (TypeScript) **or** Python 3.10+ (Python)
- [Scalar personal token](https://dashboard.scalar.com/account) and installation ID
- OpenAI API key
- Google account with Calendar access
- Zoom account
- Resend account with a verified sending domain

## Project setup

### TypeScript

```bash
mkdir meeting-scheduler && cd meeting-scheduler
npm init -y
npm install @scalar/agent ai @ai-sdk/openai dotenv tsx
```

### Python

Uses the OpenAI Agents SDK with [`scalar-agent`](../sdk.md#python). For the optional HTTP API below, install FastAPI as well.

```bash
mkdir meeting-scheduler && cd meeting-scheduler
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install "scalar-agent[openai]" python-dotenv fastapi uvicorn
```

Add your keys to a `.env` file:

```bash
SCALAR_TOKEN=your-scalar-personal-token
SCALAR_INSTALLATION_ID=your-installation-id
OPENAI_API_KEY=your-openai-api-key
```

## Setting up your Scalar MCP

In [dashboard.scalar.com](https://dashboard.scalar.com):

1. **Google Calendar** — Add tool, authenticate via OAuth, enable **Execute** on `POST /calendars/{calendarId}/events`.
2. **Zoom** — Add tool, authenticate via OAuth, enable **Execute** on `POST /users/me/meetings`.
3. **Resend** — Add tool, paste your API key, enable **Execute** on `POST /emails`.
4. Copy your **Installation ID** from the SDK tab.

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

## The scheduler

Give the agent a natural language meeting request. It figures out the right API calls, in the right order — Zoom first to get the join URL, then Calendar, then Resend.

### TypeScript

```ts
async function schedule(request: string) {
  const installation = await scalar.installation(process.env.SCALAR_INSTALLATION_ID)
  const tools = await installation.createVercelAITools()

  const { text } = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(10),
    system: `You are a scheduling assistant with access to Zoom, Google Calendar, and Resend.
Always: create the Zoom meeting first, then the Calendar event with the Zoom link, 
then send confirmation emails. Today is ${new Date().toISOString()}.`,
    prompt: request,
  })

  console.log(text)
}

schedule(`Schedule a 45-minute product demo with sarah@acme.com and james@acme.com
for next Tuesday at 2pm PT. Title: "Q3 Platform Demo".
Send them both a confirmation email from demos@yourcompany.com with the Zoom link.`)
```

### Python

```python
import asyncio
import os
from datetime import datetime, timezone

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp
from dotenv import load_dotenv
from scalar_agent import agent_scalar

load_dotenv()
scalar = agent_scalar(token=os.environ["SCALAR_TOKEN"])


async def schedule(request: str) -> None:
    installation = scalar.installation(os.environ["SCALAR_INSTALLATION_ID"])
    server = MCPServerStreamableHttp(**installation.create_openai_mcp())
    await server.connect()

    now = datetime.now(timezone.utc).isoformat()
    agent = Agent(
        name="meeting-scheduler",
        instructions=(
            "You are a scheduling assistant with access to Zoom, Google Calendar, and Resend.\n"
            "Always: create the Zoom meeting first, then the Calendar event with the Zoom link,\n"
            "then send confirmation emails.\n"
            f"Today is {now}."
        ),
        mcp_servers=[server],
    )

    result = await Runner.run(agent, request, max_turns=10)
    print(result.final_output)
    await server.cleanup()


asyncio.run(
    schedule(
        """Schedule a 45-minute product demo with sarah@acme.com and james@acme.com
for next Tuesday at 2pm PT. Title: "Q3 Platform Demo".
Send them both a confirmation email from demos@yourcompany.com with the Zoom link."""
    )
)
```

## Complete script

### TypeScript

`schedule.ts`

```ts
import 'dotenv/config'
import { agentScalar } from '@scalar/agent'
import { generateText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'

const scalar = agentScalar({ token: process.env.SCALAR_TOKEN })
const model = openai('gpt-4o')

async function schedule(request: string) {
  const installation = await scalar.installation(process.env.SCALAR_INSTALLATION_ID)
  const tools = await installation.createVercelAITools()

  const { text } = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(10),
    system: `You are a scheduling assistant with access to Zoom, Google Calendar, and Resend.
Always: create the Zoom meeting first, then the Calendar event with the Zoom link,
then send confirmation emails. Today is ${new Date().toISOString()}.`,
    prompt: request,
  })

  console.log(text)
}

schedule(`Schedule a 45-minute product demo with sarah@acme.com and james@acme.com
for next Tuesday at 2pm PT. Title: "Q3 Platform Demo".
Send them both a confirmation email from demos@yourcompany.com with the Zoom link.`)
```

### Python

`schedule.py`

```python
import asyncio
import os
from datetime import datetime, timezone

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp
from dotenv import load_dotenv
from scalar_agent import agent_scalar

load_dotenv()


async def schedule(request: str) -> None:
    scalar = agent_scalar(token=os.environ["SCALAR_TOKEN"])
    installation = scalar.installation(os.environ["SCALAR_INSTALLATION_ID"])
    server = MCPServerStreamableHttp(**installation.create_openai_mcp())
    await server.connect()

    now = datetime.now(timezone.utc).isoformat()
    agent = Agent(
        name="meeting-scheduler",
        instructions=(
            "You are a scheduling assistant with access to Zoom, Google Calendar, and Resend.\n"
            "Always: create the Zoom meeting first, then the Calendar event with the Zoom link,\n"
            "then send confirmation emails.\n"
            f"Today is {now}."
        ),
        mcp_servers=[server],
    )

    result = await Runner.run(agent, request, max_turns=10)
    print(result.final_output)
    await server.cleanup()


async def main() -> None:
    await schedule(
        """Schedule a 45-minute product demo with sarah@acme.com and james@acme.com
for next Tuesday at 2pm PT. Title: "Q3 Platform Demo".
Send them both a confirmation email from demos@yourcompany.com with the Zoom link."""
    )


if __name__ == "__main__":
    asyncio.run(main())
```

## Running the scheduler

```bash
npx tsx schedule.ts
# or
python schedule.py
```

Example output:

```
Done. Here's what I set up:

Zoom meeting created:
- Meeting ID: 123 456 7890
- Join URL: https://zoom.us/j/1234567890

Google Calendar event created:
- "Q3 Platform Demo" — Tuesday April 14, 2:00–2:45pm PT
- Guests: sarah@acme.com, james@acme.com
- Zoom link added to description

Confirmation emails sent via Resend to:
- sarah@acme.com ✓
- james@acme.com ✓
```

## Use it as an API

Wrap the scheduler in an HTTP endpoint so your team can trigger it from Slack, a form, or any internal tool.

### TypeScript

`server.ts`

```ts
import 'dotenv/config'
import { agentScalar } from '@scalar/agent'
import { generateText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'

const scalar = agentScalar({ token: process.env.SCALAR_TOKEN })
const model = openai('gpt-4o')

Bun.serve({
  port: 3000,
  async fetch(req) {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    const { request } = await req.json()
    if (!request) return new Response('Missing request', { status: 400 })

    const installation = await scalar.installation(process.env.SCALAR_INSTALLATION_ID)
    const tools = await installation.createVercelAITools()

    const { text } = await generateText({
      model,
      tools,
      stopWhen: stepCountIs(10),
      system: `You are a scheduling assistant with access to Zoom, Google Calendar, and Resend.
Always: create the Zoom meeting first, then the Calendar event, then send confirmation emails.
Today is ${new Date().toISOString()}.`,
      prompt: request,
    })

    return Response.json({ result: text })
  },
})
```

### Python

`server.py` — run with `uvicorn server:app --reload --port 3000`.

```python
import os
from datetime import datetime, timezone

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scalar_agent import agent_scalar

load_dotenv()

app = FastAPI()
scalar = agent_scalar(token=os.environ["SCALAR_TOKEN"])


class ScheduleBody(BaseModel):
    request: str


@app.post("/")
async def schedule_endpoint(body: ScheduleBody) -> dict[str, str]:
    if not body.request.strip():
        raise HTTPException(status_code=400, detail="Missing request")

    installation = scalar.installation(os.environ["SCALAR_INSTALLATION_ID"])
    server = MCPServerStreamableHttp(**installation.create_openai_mcp())
    await server.connect()

    try:
        now = datetime.now(timezone.utc).isoformat()
        agent = Agent(
            name="meeting-scheduler",
            instructions=(
                "You are a scheduling assistant with access to Zoom, Google Calendar, and Resend.\n"
                "Always: create the Zoom meeting first, then the Calendar event, then send confirmation emails.\n"
                f"Today is {now}."
            ),
            mcp_servers=[server],
        )
        result = await Runner.run(agent, body.request, max_turns=10)
        return {"result": result.final_output or ""}
    finally:
        await server.cleanup()
```

Then call it from anywhere:

```bash
curl -X POST http://localhost:3000 \
  -H 'Content-Type: application/json' \
  -d '{"request": "Schedule a 30-min call with john@corp.com tomorrow at 10am ET"}'
```

## Take it further

- **Check availability first** — add `GET /calendars/{calendarId}/events` in search mode so the agent can check for conflicts before scheduling
- **Reschedule support** — extend the prompt to handle "move my 2pm Tuesday meeting to Wednesday"
- **Recurring meetings** — ask the agent to set the Google Calendar event as weekly recurring
