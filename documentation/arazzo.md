# Arazzo Specification

We're in the process of adding [Arazzo](https://spec.openapis.org/arazzo/latest.html) support.

Arazzo describes deterministic sequences of API calls ("workflows") across one or more API
descriptions — for example logging in, then using the session token to fetch a resource. An
OpenAPI or AsyncAPI description tells you what the endpoints are; an Arazzo description tells you
how to accomplish something with them.

> [!NOTE]
> Arazzo support is early work in progress. Nothing renders yet — this page will be filled in as
> loading, navigation, and rendering land. In the meantime, the target is the **Arazzo 1.1.0**
> shape, with 1.0.x documents accepted unchanged (1.1.0 is purely additive over 1.0.x).
