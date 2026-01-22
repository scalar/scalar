# Migate from Scalar Docs 1.0

With Scalar Docs 2.0 we've completely started from scratch. We tried to stick to the patterns we already had, so they way you set it up is not too different.

## How do I know whether I use Scalar Docs 1.0?

If you created a project before February 2026, you probably use Scalar Docs 1.0:

```json
// scalar.config.json (Scalar Docs 1.0)
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config.json",
  "siteConfig": {
    // …
  },
  "guides": [
    // …
  ],
  "references": [
    // …
  ],
}
```

For Scalar Docs 2.0 we still use the `scalar.config.json`, but the structure changed a bit:

```json
// scalar.config.json (Scalar Docs 2.0)
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "info": {
    // …
  },
  "siteConfig": {
    // …
  },
  "navigation": {
    "routes": {
      // …
    }
  }
}
```

## Do you have to switch to 2.0?

Yes, please, it's just so much better:

## Features in Scalar Docs 2.0

🚧 WIP 🚧
