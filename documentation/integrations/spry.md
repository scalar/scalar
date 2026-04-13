# API Reference for Spry

[Spry](https://github.com/medz/spry) has built-in OpenAPI generation and can serve a **Scalar**-powered API reference page without installing an additional Scalar integration package.

## Installation

```bash
dart pub add spry
```

## Generate OpenAPI and the docs UI

Configure OpenAPI generation in your `spry.config.dart` and add `Scalar(...)` to `OpenAPIConfig.ui`:

```dart
import 'package:spry/config.dart';
import 'package:spry/openapi.dart';

void main() {
  defineSpryConfig(
    openapi: .new(
      document: .new(
        info: .new(
          title: 'My API',
          version: '1.0.0',
        ),
      ),
      output: .route('openapi.json'),
      ui: Scalar(
        route: '/reference',
        title: 'My API Reference',
        theme: 'moon',
        layout: 'modern',
      ),
    ),
  );
}
```

Run your Spry app and open `/reference`. Spry will generate the Scalar page and load the OpenAPI document from `/openapi.json`.

This generated docs route is available when you use `OpenAPIOutput.route(...)`. If you write the OpenAPI document to a local file with `OpenAPIOutput.local(...)`, you can still serve Scalar manually, but the OpenAPI document must also be available from a URL that the browser can fetch.

## Serve Scalar manually

If you want to control the docs route yourself, use `defineScalarHandler(...)` from `package:spry/openapi.dart`:

```dart
import 'package:spry/openapi.dart';
import 'package:spry/spry.dart';

final app = Spry(
  routes: {
    '/docs': {
      .get: defineScalarHandler(
        url: '/openapi.json',
        title: 'My API Reference',
        theme: 'purple',
        layout: 'classic',
      ),
    },
  },
);
```

The `url` can be either a local pathname such as `/openapi.json` or a full URL such as `https://api.example.com/openapi.json`. If you use `OpenAPIOutput.local(...)`, expose that file through one of your own routes or publish it separately, then pass that reachable URL to `defineScalarHandler(...)`.

## Generated docs route options

When you use `OpenAPIConfig.ui`, Spry supports these options on `Scalar(...)`:

| Field | Type | Description |
|---|---|---|
| `route` | `String` | The route where Spry serves the Scalar page |
| `title` | `String?` | The page `<title>` override |
| `theme` | `String?` | A Scalar theme such as `default`, `moon`, `purple`, or `solarized` |
| `layout` | `String?` | The Scalar layout, such as `modern` or `classic` |

## Manual handler options

When you use `defineScalarHandler(...)`, Spry forwards the key Scalar page options directly:

| Field | Type | Description |
|---|---|---|
| `url` | `String` | A local pathname or full OpenAPI document URL |
| `title` | `String` | The page `<title>` |
| `theme` | `String?` | A Scalar theme such as `default`, `moon`, `purple`, or `solarized` |
| `layout` | `String?` | The Scalar layout, such as `modern` or `classic` |

---

You can learn more about Spry's OpenAPI support in the [Spry OpenAPI Docs UI](https://spry.medz.dev/guide/openapi#docs-ui).
