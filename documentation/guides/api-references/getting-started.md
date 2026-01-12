# Getting Started
<div class="flex gap-2">
<a href="https://www.npmjs.com/@scalar/api-reference"><img src="https://img.shields.io/npm/v/@scalar/api-reference"></a>
<a href="https://www.npmjs.com/@scalar/api-reference"><img src="https://img.shields.io/npm/dm/@scalar/api-reference"></a>
<a href="https://discord.gg/scalar"><img src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2"></a>
</div>

The Scalar API Reference renders a modern documentation for your OpenAPI/Swagger documents and all you need is a few lines of code.

The quickest way to start is a HTML page, that loads our JavaScript:

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
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
        // Avoid CORS issues
        proxyUrl: 'https://proxy.scalar.com',
      })
    </script>
  </body>
</html>
```

If you want a more seamless integration with your framework of choice, chances are high we got one for you.
