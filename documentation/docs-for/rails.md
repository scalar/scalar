# Rails API documentation

Generate an OpenAPI document from the request specs you already write, then mount an interactive Scalar API reference in your Rails routes with one line.

Rails has no built-in OpenAPI output, so documenting a Rails API takes two tools: something that produces the OpenAPI document, and something that renders it. For the first, this page uses [rspec-openapi](https://github.com/exoego/rspec-openapi), which records your existing request specs into `doc/openapi.yaml` without a new DSL. For the second, it uses [scalar_ruby](https://github.com/dmytroshevchuk/scalar_ruby), a Rack app that serves the Scalar API reference.

To be clear about ownership: scalar_ruby is a community gem, maintained on GitHub by dmytroshevchuk, not by Scalar. Scalar does not ship an official Ruby or Rails package today. The gem is linked from Scalar's [Ruby on Rails integration page](/products/api-references/integrations/ruby-on-rails), and the renderer it loads is the same MIT-licensed Scalar API reference used everywhere else.

## Set it up in three steps

<scalar-steps>
<scalar-step title="Generate an OpenAPI document from your request specs">

```ruby
# Gemfile
gem 'rspec-openapi', group: :test
```

```bash
OPENAPI=1 bundle exec rspec
```

rspec-openapi writes `doc/openapi.yaml` from every request spec that ran. Commit it, and re-run the command when your API changes. Manual edits to the file (descriptions, examples) are preserved on the next run. Recent versions emit OpenAPI 3.2 by default; if you want a 3.1 document, set `RSpec::OpenAPI.openapi_version = '3.1.0'` where you configure the gem.

</scalar-step>
<scalar-step title="Install scalar_ruby and mount it">

```bash
bundle add scalar_ruby
```

```ruby
# config/routes.rb
Rails.application.routes.draw do
  mount Scalar::UI, at: '/docs'
end
```

At this point `/docs` renders Scalar's Galaxy example document, which is a quick way to check that the mount works. The gem also has a generator, `bin/rails generate scalar:install`, that does this setup for you.

</scalar-step>
<scalar-step title="Point it at your document">

```ruby
# config/initializers/scalar.rb
Scalar.setup do |config|
  config.page_title = 'My API Reference'
  config.configuration = { content: File.read(Rails.root.join('doc/openapi.yaml')) }
end
```

Restart the server and open `http://localhost:3000/docs`. The gem loads the latest Scalar bundle from jsDelivr by default; set `config.library_url` to pin a specific version. Embedding with `content` means the YAML file never needs a public URL. To load it from a URL instead, use `config.configuration = { url: 'https://example.com/openapi.json' }`.

</scalar-step>
</scalar-steps>

Already on [rswag](https://github.com/rswag/rswag)? Keep it. rswag writes OpenAPI 3.0 files from its spec DSL and `rswag-api` serves them under `/api-docs`. Set `url` in the Scalar initializer to the path rswag-api serves, and Scalar renders it.

## See it live

The Scalar Galaxy demo is the same renderer on an example API with authentication schemes, schemas, and webhooks. Try search, the generated code samples, and the "Test Request" button.

<scalar-button
  title="Open the live demo"
  href="https://galaxy.scalar.com/"
  icon="phosphor/regular/rocket-launch">
</scalar-button>

## What you get

**Docs backed by tests.** With rspec-openapi, an endpoint appears in the documentation because a spec exercised it, with the request and response shapes that spec actually saw. Documentation that comes from passing tests is hard to get wrong by accident.

**A Rack mount you control.** `Scalar::UI` is mounted like any engine, so Rails route constraints, or authentication in front of the mount, decide who can see the docs.

**An API client.** Each operation has a "Test Request" button that opens the [Scalar API client](/products/api-client) with parameters and security schemes prefilled. The client is also a standalone, open-source app for desktop and web.

**SDKs.** The [Scalar SDK generator](/products/sdk-generator) reads the same `doc/openapi.yaml`. TypeScript, Python, Go, Java, Kotlin, and CLI targets are generally available. A Ruby target exists but is experimental, as are C#, PHP, Rust, Swift, Dart, and C++. Every plan includes one SDK.

**A hosted MCP server.** Scalar can host an [MCP server](/products/agent/mcp) generated from your OpenAPI document, with OAuth, so AI agents can call the endpoints you choose. Scalar runs it; you do not add MCP code to your Rails app. Hosted MCP servers are included from the Pro plan.

The renderer is MIT licensed. Hosted docs, SDKs, and MCP servers are on the [pricing page](/pricing).

## Migrating from Swagger UI or Redoc

Most Rails apps that show Swagger UI use `rswag-ui`, mounted with `mount Rswag::Ui::Engine`. The switch keeps your specs and generated files intact:

1. Leave `rswag-specs` and `rswag-api` in place. `rake rswag:specs:swaggerize` keeps producing the document, and `rswag-api` keeps serving it at `/api-docs`.
2. Add `scalar_ruby`, mount `Scalar::UI`, and set `url` to the file rswag-api serves.
3. Remove the `Rswag::Ui::Engine` mount and the `rswag-ui` gem once the new page looks right. Mount Scalar at the old path if people have bookmarked it.

Redoc pages, whether static or served from a controller, move the same way: keep the document, replace the page. See the [Swagger UI migration guide](/resources/migration/swagger-ui) for the general steps.

## Frequently asked questions

<scalar-detail title="Is there an official Scalar gem for Rails?">
No. scalar_ruby is a community-maintained gem. It loads the official Scalar API reference, and Scalar links to it from the Ruby on Rails integration page, but Scalar does not maintain it. If you prefer no extra gem, render the reference from any view with Scalar's HTML embed.
</scalar-detail>

<scalar-detail title="rspec-openapi or rswag?">
rspec-openapi generates the document from ordinary request specs, with no special DSL, so it suits teams with a good request-spec suite. rswag uses its own spec DSL that doubles as documentation and produces OpenAPI 3.0. Scalar renders the output of either.
</scalar-detail>

<scalar-detail title="Does this work with Grape or Sinatra?">
The rendering side does, because `Scalar::UI` is a Rack app and Scalar only needs an OpenAPI document. How you generate that document depends on the framework.
</scalar-detail>

<scalar-detail title="Which Ruby versions does scalar_ruby support?">
The gem's README lists Ruby 2.7 through 3.4 and 4.0 as tested. Check the gem repository for the current list.
</scalar-detail>

<scalar-detail title="What does it cost?">
The renderer is free and MIT licensed, and scalar_ruby is open source. Hosted Scalar docs start free; Pro is $150 per month and Business is $600 per month.
</scalar-detail>

## Get started

```bash
bundle add scalar_ruby
```

Or [create a free Scalar account](https://dashboard.scalar.com/register) and upload `doc/openapi.yaml` to host the reference on its own domain.

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [API documentation best practices](/learn/openapi/api-documentation-best-practices)
- **Docs:** [Ruby on Rails integration reference](/products/api-references/integrations/ruby-on-rails)
- **Product:** [Scalar API References](/products/api-references) — the open-source renderer that scalar_ruby loads
