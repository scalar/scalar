# Accelerating Warp's AI-Native HR Platform with Scalar

<div class="sdk-targets">
  <span class="sdk-targets-label">Generated SDKs</span>
  <a class="sdk-target" href="https://github.com/TeamWarp/warp-sdk-go" target="_blank" rel="noreferrer">
    <scalar-icon src="../../assets/logos/go.svg"></scalar-icon>
    Go
  </a>
  <a class="sdk-target" href="https://github.com/TeamWarp/warp-sdk-typescript" target="_blank" rel="noreferrer">
    <scalar-icon src="../../assets/logos/typescript.svg"></scalar-icon>
    TypeScript
  </a>
  <a class="sdk-target" href="https://github.com/TeamWarp/warp-sdk-python" target="_blank" rel="noreferrer">
    <scalar-icon src="../../assets/logos/python.svg"></scalar-icon>
    Python
  </a>
  <a class="sdk-target" href="https://github.com/TeamWarp/warp-cli" target="_blank" rel="noreferrer">
    <scalar-icon src="phosphor/bold/terminal-window"></scalar-icon>
    CLI
  </a>
</div>

<scalar-image
  src="/warp-branding.png"
  alt="A Formula 1 car in Warp's white and orange livery, marked “Operation Warp Speed”"
  size="full">
</scalar-image>

Warp is building AI-native employee management for fast-growing companies — and betting that everything in the product should be reachable by API. When their SDK vendor told them the product was being discontinued, they moved all four surfaces to Scalar: every language at parity, no breaking changes, and not one customer who had to be told.

> “The best part has been how little I think about SDKs. A few clicks set up every language to parity with what we had, with no breaking changes — which was huge for us.”
>
> **Adam Rankin**, CTO, Warp

## An HR platform built to be called

Warp handles everything from hiring an employee through paying them: payroll, benefits, MDM, application access, authentication, time off, shift tracking, onboarding, offboarding, and staying compliant everywhere the company operates. The pitch is AI-native employee management — agents on the back end keeping customers compliant, and a product that will take a PDF of a company policy and turn it into working configuration rather than making someone fill in a long form.

The part that matters here is what they decided to do with the platform itself.

> “Everything that can be done in our app by clicking buttons can just be exposed via API — or whatever, bring your own agent. In our space, no one’s really done that in a first-class way. It’s all sort of an afterthought.”

So Warp made the API free on every tier.

> “Just open it up and see what people build — as opposed to, you’ve got to hop on a sales call to even know what’s possible.”

## Three kinds of developer showed up

> “It’s a pretty new offering and we’re already seeing a lot of different use cases.”

The API is young, and the demand has already split into three shapes — one of which barely existed as a category two years ago.

- **Running the company from an agent.** Customers who want to connect their Claude to everything: building reports, pulling data, sending an employee invite or signing an offer — all without opening the app.
- **Embedded payroll.** Partners embedding full payroll services inside their own product. The platform play.
- **Automating company messaging.** Warp sends a webhook when someone requests time off; a customer builds a Discord bot to surface it. “These days an agent is probably writing that.”

There is also a fourth answer Warp hears constantly in sales calls, and it says something about where the market is: we don’t really know what we want to build, we just want an API to see what we can build.

## Needing a new home for the SDKs

> “One day they basically sent us an email: we’re shutting down, we’re discontinuing. Our product is end of life in six months. So we were looking for alternatives.”

Warp had been generating their client libraries with a commercial vendor. That arrangement ended on the vendor’s timetable, not Warp’s, and the team had a fixed window to find a replacement, move four surfaces, and do it without disturbing the developers already integrated against them.

Building the generator in-house was the obvious alternative, and Adam has a short answer for the people who suggest it.

> “Everyone’s like, ‘oh, you could just do that yourself.’ It’s like — no. I don’t actually feel like setting up a whole generator for every language. We’re not an SDK company. We’re a payroll company, and we just want SDKs to work well.”

## He tried the build anyway

> “I don’t want a billion lines of slop generating my SDK.”

Before moving, Adam did what most engineering leaders would now do first: he pointed a coding agent at the problem and asked it to reproduce the SDKs in the same shape. It sort of worked.

> “I ended up with something that just seemed really brittle and was taking my time. And even a little bit of my time is not worth maintaining that when we have features to ship and customers to make happy.”

The alternative was a permanent line item. Asked what running SDKs properly in-house would have cost, Adam put a number on it immediately:

> “We’d have someone working on developer products, probably 50% of their time. That’s expensive. And we just haven’t had to have that at all.”

## A migration nobody noticed

> “No one asked. No one needed to know.”

Warp had real developers on the existing libraries. That made the constraint tighter rather than looser: a group of integrators is exactly the group you cannot afford to break. Every language came across at parity with what Warp already had, and existing users upgraded their SDK without changing a line.

**Results:** every language at parity · no breaking changes · no customer communication required · set up in a few clicks

## More than the libraries

> “Figuring out what more our OpenAPI could do that we didn’t even know.”

The part Warp didn’t expect was what the move taught them about their own spec. Working through the Scalar docs and the OpenAPI extensions surfaced capabilities in their schema they hadn’t been using — which matters more than usual for a company whose stated goal is that every button in the product has an API behind it.

> “Setting up automations, the OpenAPI extensions have been really awesome — figuring out what more our OpenAPI could do that we didn’t even know.”

> “The best part has been how little I think about SDKs. We’re not an SDK company. We’re a payroll company, and we just want SDKs to work well.”
>
> **Adam Rankin**, CTO, Warp

<style>
  .sdk-targets {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 20px;
    margin-bottom: 24px;
  }
  .sdk-targets-label {
    color: var(--scalar-color-2);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-regular);
  }
  .sdk-target {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--scalar-color-1);
    font-size: var(--scalar-small);
    font-weight: var(--scalar-semibold);
    text-decoration: none;
  }
  .sdk-target:hover {
    color: var(--scalar-color-accent);
    text-decoration: none;
  }
  .sdk-target:focus-visible {
    outline: 2px solid var(--scalar-color-accent);
    outline-offset: 3px;
    border-radius: var(--scalar-radius);
  }
  .sdk-target svg {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
  }
</style>
