# HTML

To get started, you can just use a simple HTML file. It’s the easiest, and probably also the quickest way to get up and running, literally in seconds.

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
    <!-- Need a Custom Header? Check out this example https://codepen.io/scalarorg/pen/VwOXqam -->
    <script
      id="api-reference"
      data-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
```

This should render our `@scalar/galaxy` OpenAPI example, using the latest version of `@scalar/api-reference`.

## Configuration

If you want to fine-tune your API reference and pass a custom configuration, you can use the `data-configuration` HTML attribute. But `configuration` objects can get big, so that’s the recommended way to pass the configuration then:

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
    <script
      id="api-reference"
      data-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml"></script>

    <!-- Optional: You can set a full configuration object like this: -->
    <script>
      var configuration = {
        theme: 'purple',
      }

      document.getElementById('api-reference').dataset.configuration =
        JSON.stringify(configuration)
    </script>

    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
```

## JSON

You can also just directly pass JSON content:

```html
<script
  id="api-reference"
  type="application/json">
  {
    "openapi": "3.1.0",
    "info": {
      "title": "Hello World",
      "version": "1.0.0"
    },
    "paths": {}
  }
</script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
```

## YAML

And if you prefer YAML, you just need to set the `type` attribute to `application/yaml`:

```html
<script
  id="api-reference"
  type="application/yaml">
  openapi: 3.1.0
  info:
    title: Hello World
    version: 1.0.0
  paths: {}
</script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
```

## Version

It’s recommended to use the latest version from jsdelivr. You’ll get continuous updates, fixes and other improvements and that’s also the one we’re testing and monitoring continuously:

https://cdn.jsdelivr.net/npm/@scalar/api-reference

If you really want to stick to a specific version, that’s possible, too:

https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.24.46
