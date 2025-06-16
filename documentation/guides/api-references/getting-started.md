# Getting Started
Reading this guide helps you to get started with our wonderful Open-Source API References as quick as possible.


Our most simplest example is using the CDN integration of our API References

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
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        // Avoid CORS issues
        proxyUrl: 'https://proxy.scalar.com',
      })
    </script>
  </body>
</html>
```

> Need a Custom Header? Check out this example: https://codepen.io/scalarorg/pen/VwOXqam

### Customization

| Topic                                           | Description                          |
| ----------------------------------------------- | ------------------------------------ |
| [Themes](themes)               | Predefined themes, layouts & styling |
| [Configuration](configuration) | The universal configuration object   |
| [Plugins](plugins)             | Extend the functionality             |
| [OpenAPI](openapi)             | OpenAPI and our extensions to it     |
| [Markdown](markdown)           | The supported Markdown syntax        |

And there’s an ever-growing list of plugins and integrations:

### Integrations

- [HTML/JS API](integrations/html-js) (works everywhere)
- [.NET](integrations/aspnetcore/README)
- [AdonisJS](integrations/adonisjs)
- [Django](https://github.com/m1guer/django-scalar)
- [Django Ninja](integrations/django-ninja/README)
- [Docusaurus](integrations/docusaurus/README)
- [Express](integrations/express/README)
- [FastAPI](integrations/fastapi/README)
- [Fastify](integrations/fastify/README)
- [Go](integrations/go)
- [Hono](integrations/hono/README)
- [Laravel Scribe](integrations/laravel-scribe)
- [Micronaut](https://micronaut-projects.github.io/micronaut-openapi/latest/guide/index.html#scalar)
- [NestJS](integrations/nestjs/README)
- [Next.js](integrations/nextjs/README)
- [Nuxt](integrations/nuxt/README)
- [React](packages/api-reference-react/README)
- [Ruby on Rails](https://github.com/dmytroshevchuk/scalar_ruby)
- [Rust](integrations/rust)
- [Scalar for Laravel](https://github.com/scalar/laravel)
- [Ts.ED](https://tsed.dev/tutorials/scalar.html)
- [Vue.js](packages/api-reference/README)
- [Python](https://github.com/iagobalmeida/scalar_doc)


### Built-in Support

The following frameworks have chosen Scalar API Reference as their default OpenAPI documentation UI, recognizing its developer-friendly features and modern design:

- [ElysiaJS](integrations/elysiajs)
- [HappyX](https://github.com/HapticX/happyx)
- [Litestar](https://docs.litestar.dev/latest/usage/openapi/ui_plugins.html)
- [Nitro](integrations/nitro)
- [Platformatic](integrations/platformatic)
- [oRPC](https://orpc.unnoq.com/docs/openapi/plugins/openapi-reference)
