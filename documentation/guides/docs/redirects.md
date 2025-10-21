# Redirects

Redirects allow you to automatically redirect users from one URL to another in your Scalar Docs project. This is useful for handling URL changes, deprecated pages, migrating from other platforms, or creating shortcuts to commonly accessed content.

## Configuration

Redirects are configured in your `scalar.config.json` file under the `routing.redirects` section:

```json
{
  "routing": {
    "redirects": [
      {
        "from": "/old-path",
        "to": "/new-path"
      }
    ]
  }
}
```

### Wildcard Redirects

You can use wildcards to redirect multiple paths with a single rule:

```json
{
  "from": "/old-path/*",
  "to": "/new-path"
}
```
