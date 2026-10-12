# Getting Started

The API Reference renders a modern documentation for your API documents and all you need is a few lines of code.

## Set up with your coding agent

Install the `scalar-api-reference` skill to give your coding agent guidance for framework integration, configuration, and troubleshooting:

```bash
npx skills add scalar/scalar --skill scalar-api-reference
```

Then ask your agent: “Set up Scalar API Reference in this project using its existing API description.”

## Set up with HTML

The quickest way to start is a HTML page, that loads our JavaScript:

```html
<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>

  <body>
    <div id="app"></div>

    <!-- Load the Script -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

    <!-- Initialize the API Reference -->
    <script>
      Scalar.createApiReference('#app', {
        // The URL of the API document
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
        // Avoid CORS issues
        proxyUrl: 'https://proxy.scalar.com',
      })
    </script>
  </body>
</html>
```

If you want a more seamless integration with your framework of choice, chances are high we got one for you.

Documenting an event-driven API? [AsyncAPI documents](../../asyncapi.md) load the same way — channels, operations, and messages instead of paths and responses.
