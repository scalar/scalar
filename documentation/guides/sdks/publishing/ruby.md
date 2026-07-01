# Ruby (RubyGems)

The Ruby target publishes to [RubyGems](https://rubygems.org/). The gem name is the target's `gemName`. See the [Ruby configuration](../configuration/ruby.md) for options.

RubyGems publishing uses an **API key**. The release workflow pushes the gem with that key.

## Enable publishing

```json
{
  "targets": {
    "ruby": {
      "gemName": "acme",
      "publish": { "rubygems": true }
    }
  }
}
```

## Set up the API key

<scalar-steps>
  <scalar-step id="gem-key-create" title="Create a RubyGems API key">

On [rubygems.org](https://rubygems.org/profile/api_keys), create an API key with the **Push rubygem** scope. Scope it to your gem once it exists.

  </scalar-step>

  <scalar-step id="gem-key-secret" title="Add it to the repository">

Add the key as a repository secret named **`RUBYGEMS_API_KEY`**. See [Adding repository secrets](github.md#adding-repository-secrets).

  </scalar-step>
</scalar-steps>

The workflow reads it as `GEM_HOST_API_KEY` when running `gem push`.

## Notes

- The workflow checks the RubyGems API for the version first and skips `gem push` if it is already published, so re-merges are safe.
