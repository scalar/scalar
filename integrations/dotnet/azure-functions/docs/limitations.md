# Limitations & roadmap

## You must provide the function

Unlike the ASP.NET Core integration (where `MapScalarApiReference()` registers the endpoint for you), this package
requires you to declare a small HTTP-triggered function yourself and forward the request to `IScalarApiReference`
(see [Getting Started](./getting-started.md)).

This is intentional for the first release. A ready-made, auto-discovered `[Function]` shipped inside the package
would depend on the Azure Functions worker SDK source generator discovering `[Function]` methods in a **referenced
assembly**, which is not reliable by default. The explicit handler always works across both HTTP models and avoids
that limitation.

**Roadmap:** a zero-boilerplate mode (no hand-written function) is being evaluated and may be added in a future
release once cross-assembly function discovery can be enabled cleanly.

## Route parameter name

The catch-all route parameter must be named `path` (e.g. `Route = "scalar/{*path}"`). The handler reads this value
to distinguish a static asset request from the reference page and to resolve the document name.

## In-process model

Only the isolated worker model is supported. The in-process model is not supported (it reaches end of support in
November 2026).
