# Ruby SDK generator from OpenAPI

Scalar generates a Ruby gem from your OpenAPI document with a `Client` object, `snake_case` resources, keyword arguments, and pagination you walk with a block. **The Ruby target is experimental.** It generates working code and is part of the same continuous integration matrix as the generally available targets, but we would rather talk with you before you publish it to your users than have you find a gap in production.

## What the generated code looks like

This is the Ruby quickstart shown for Warp's HR API in the [SDK Generator demo](/products/sdk-generator). The gem is installed with `bundle add warp`:

```ruby
require "warp"

client = Warp::Client.new(api_key: ENV["WARP_API_KEY"])

# Auto-paginating: the next cursor page is fetched as you iterate.
client.time_off.list_assignments(limit: 50).each do |assignment|
  puts "#{assignment.id} #{assignment.policy.name}"
end
```

Everything lives under one top-level module named after your API (`Warp`), models sit under `Warp::Models`, and the client reads `WARP_API_KEY` from the environment when you omit `api_key:`. Methods read like Ruby: `list_assignments(limit: 50)`, not `time_off_list_assignments_get(opts = {})`.

## Ruby idioms the generator targets

**Keyword arguments over option hashes.** Request parameters are keyword arguments, so a typo in a parameter name fails loudly instead of being silently dropped into a hash.

**Blocks for iteration.** List endpoints return a page object (`Warp::CursorPage` in the Warp example). The pagination guide documents `page.auto_paging_each { |item| ... }` for walking every item across pages and `page.next_page` for stepping manually, which is how Ruby developers expect enumerables to behave.

**Namespaced models.** Response types such as `Warp::Models::TimeOffAssignment` are real classes, so `assignment.policy.name` works and your editor can follow it.

**A generated `api.md` and Agent Skill.** Like every target, the gem ships an `api.md` listing each method with its types and a `SKILL.md` so coding agents stop inventing method names.

**The generator's shared feature set.** The SDK Generator's feature list covers retries on temporary failures (twice by default, covering network errors, 408, 409, 429, and 5xx) with `Retry-After` support, a 60-second default timeout, and typed errors carrying status, headers, and body. As an experimental target, confirm the exact option and error class names in your generated README before you document them.

**One pagination caveat worth knowing.** If your API returns a full next-page URL rather than a cursor token (a `cursorUrl` scheme), the Ruby target declines that scheme instead of guessing. Prefer a `cursor` scheme where your API offers both. See [pagination](/products/sdk-generator/pagination).

## Configure the target

```json
{
  "targets": {
    "ruby": {
      "gemName": "acme_api",
      "destinations": {
        "production": { "repo": "acme/acme-ruby" }
      },
      "publish": {
        "rubygems": { "releaseEnvironment": "production" }
      }
    }
  }
}
```

`gemName` is the name users put in their Gemfile. The generated project includes a `.gemspec`, `lib/` tree, README, `api.md`, and `SKILL.md`. See the [Ruby configuration](/products/sdk-generator/configuration/ruby) reference.

## Publishing to RubyGems

RubyGems publishing uses an API key rather than OIDC in Scalar's generated workflow:

1. On [rubygems.org](https://rubygems.org/profile/api_keys), create an API key with the **Push rubygem** scope. Once the gem exists, scope the key to it.
2. Add it to your repository as the secret `RUBYGEMS_API_KEY`.
3. Merge the release pull request Scalar keeps open. The workflow runs `gem push`, reading the key as `GEM_HOST_API_KEY`.

Before pushing, the workflow asks the RubyGems API whether the version already exists and skips `gem push` if it does, so re-merges are safe. Details are in [RubyGems publishing](/products/sdk-generator/publishing/ruby).

## For Rails teams

If your API is a Rails app, you probably already produce an OpenAPI document, for example with rswag or a hand-maintained YAML file. That same document can power a [Rails API reference](/products/api-references/integrations/ruby-on-rails) and a Ruby gem for the developers who integrate with you. Because both come from one description, the parameter names in your docs and the keyword arguments in the gem cannot drift apart. When the document changes, Scalar mints a new SDK version, regenerates the gem, and opens a pull request, so the client follows the API instead of lagging a release behind.

## Scalar compared with OpenAPI Generator for Ruby

OpenAPI Generator's [`ruby` generator](https://openapi-generator.tech/docs/generators/ruby) is stable and free. It lets you choose the HTTP library with `library`: `typhoeus` by default, or `faraday` or `httpx`. The default gem name is `openapi_client`. There is also a [`ruby-nextgen`](https://openapi-generator.tech/docs/generators) generator, currently marked beta.

| | Scalar Ruby target (experimental) | OpenAPI Generator `ruby` |
| --- | --- | --- |
| Status | Experimental | Stable |
| HTTP library | One generated client | Typhoeus (default), Faraday, or HTTPX |
| Client shape | `Warp::Client.new`, resources as methods | One `*Api` class per tag |
| Method names | Normalised verbs: `list`, `retrieve`, `create` | Derived from `operationId` |
| `oneOf` / `anyOf` / `allOf` | Lowered into typed unions; check your schemas in the preview repository | Marked unsupported in the generator's feature table |
| Pagination | Generated page objects with block iteration | Not among the generator's documented options |
| RubyGems release | Workflow and release PR generated into your repo | Gemspec generated; release process is yours |

If you already run a Faraday middleware stack and want the generated client to sit on it, OpenAPI Generator's library choice is a real advantage. For the wider picture, see [OpenAPI Generator alternatives](/alternatives/openapi-generator).

## Frequently asked questions

<scalar-detail title="Is the Ruby SDK generator stable?">

No, Ruby is an experimental target. It generates working code and runs in the same continuous integration matrix as Java, Kotlin, C#, and the GA targets. Talk to us before you depend on it for a public gem.

</scalar-detail>

<scalar-detail title="Can Scalar publish a gem with trusted publishing instead of an API key?">

The generated RubyGems workflow uses an API key stored as `RUBYGEMS_API_KEY`. Scope it to the Push rubygem permission and to your gem once it exists.

</scalar-detail>

<scalar-detail title="How do I paginate with the generated Ruby SDK?">

Call the list method and iterate with a block. The pagination guide documents `auto_paging_each` for walking every item and `next_page` for stepping page by page.

</scalar-detail>

<scalar-detail title="Can I move an existing Stainless Ruby SDK to Scalar?">

Scalar reads `stainless.yml`, so resource names, method names, and pagination schemes carry across. Because Ruby is experimental on Scalar, diff the generated surface against your current gem before switching. The [Stainless migration guide](/resources/migration/stainless) explains the process.

</scalar-detail>

<scalar-detail title="Do my own changes survive regeneration?">

Yes. Every build three-way merges the new output with your repository and opens a pull request, so edits and added files carry forward. See [custom code](/products/sdk-generator/custom-code).

</scalar-detail>

<scalar-button
  title="Preview a Ruby SDK from your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [Ruby configuration](/products/sdk-generator/configuration/ruby) · [Publishing to RubyGems](/products/sdk-generator/publishing/ruby)
- **Product:** [SDK Generator](/products/sdk-generator) — see the Ruby output from your own OpenAPI document before you commit

---

*OpenAPI Generator details are taken from [openapi-generator.tech](https://openapi-generator.tech/docs/generators/ruby) and the [OpenAPITools/openapi-generator repository](https://github.com/OpenAPITools/openapi-generator) as of September 2026 (release 7.25.0). If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.*
