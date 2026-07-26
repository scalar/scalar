# Arazzo Specification

We're in the process of adding [Arazzo](https://spec.openapis.org/arazzo/latest.html) support.

Arazzo describes deterministic sequences of API calls ("workflows") across one or more API
descriptions — for example logging in, then using the session token to fetch a resource. An
OpenAPI or AsyncAPI description tells you what the endpoints are; an Arazzo description tells you
how to accomplish something with them.

## Current status

Arazzo documents can be loaded into a workspace the same way OpenAPI and AsyncAPI documents are —
they're recognized automatically from their `arazzo` field, no extra configuration needed:

```javascript
Scalar.createApiReference('#app', {
  url: '/arazzo.json'
})
```

The document is validated and stored, but **nothing renders or navigates yet** — there's no
sidebar entry, no workflow view, and no way to run a workflow from the reference or the client.
Loading a workspace that contains only an Arazzo document will currently show an empty reference.

## Supported versions

The target is the **Arazzo 1.1.0** shape. 1.0.x documents are accepted unchanged, since 1.1.0 is
purely additive over 1.0.x — there's no upgrade step to configure.

> [!NOTE]
> Arazzo support is early work in progress. This page will be filled in as navigation and
> rendering land.
