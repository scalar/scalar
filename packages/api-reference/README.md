# Scalar API Reference

[![Version](https://img.shields.io/npm/v/%40scalar/api-reference)](https://www.npmjs.com/package/@scalar/api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-reference)](https://www.npmjs.com/package/@scalar/api-reference)
[![Hits on jsdelivr](https://img.shields.io/jsdelivr/npm/hm/%40scalar%2Fapi-reference)](https://www.jsdelivr.com/package/npm/@scalar/api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-reference)](https://www.npmjs.com/package/@scalar/api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Interactive API Reference from OpenAPI/Swagger Documents [Try our Demo](https://docs.scalar.com/swagger-editor)

[![Screenshot of an API Reference](https://github.com/scalar/scalar/assets/6201407/d8beb5e1-bf64-4589-8cb0-992ba79215a8)](https://docs.scalar.com/swagger-editor)

### CDN

```html
<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>

  <body>
    <div id="app"></div>

    <!-- Load the Script -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

    <!-- Initialize the Scalar API Reference -->
    <script>
      Scalar.createApiReference('#app', {
        // The URL of the OpenAPI/Swagger document
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
        // Avoid CORS issues
        proxyUrl: 'https://proxy.scalar.com',
      })
    </script>
  </body>
</html>
```

## Documentation

[Read the documentation here](https://guides.scalar.com/scalar/scalar-api-references/integrations/htmljs)

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
