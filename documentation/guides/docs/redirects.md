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
  "from": "/old-path/:wildcard",
  "to": "/new-path"
}
```

This will redirect `/old-path/whatever-that-is` to `/new-path`.

Or, if you have a specific prefix:

```json
{
  "from": "/old-path/12345-:wildcard",
  "to": "/new-path"
}
```

This will redirect `/old-path/12345-whatever-that-is` to `/new-path`.

### Regex Redirects

You can even use regular expressions in your redirects:

```json
{
  "from": "/old-path/:pathMatch(.*)*",
  "to": "/new-path"
}
```
