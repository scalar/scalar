# Django API documentation

Render the OpenAPI document that drf-spectacular builds from your Django REST Framework views as an interactive API reference, with one small Django view and no extra Python package.

To be plain about it up front: Scalar does not publish an official Django REST Framework package. It does not need one. drf-spectacular already generates an OpenAPI 3 document from your serializers and viewsets, and the Scalar API reference is a single script that can render that document from any HTML page. The setup below uses drf-spectacular's documented settings and the embed from Scalar's [HTML integration](/products/api-references/integrations/html-js). If you use Django Ninja instead of DRF, there is an official package, `scalar-ninja`; see the [Django Ninja integration](/products/api-references/integrations/django-ninja).

## Set it up in three steps

<scalar-steps>
<scalar-step title="Install drf-spectacular">

```bash
pip install drf-spectacular
```

```python
# settings.py
INSTALLED_APPS = [
    # ALL YOUR APPS
    'drf_spectacular',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Your Project API',
    'DESCRIPTION': 'Your project description',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
```

drf-spectacular reads your serializers, viewsets, and `@extend_schema` decorators and produces an OpenAPI 3.0 or 3.1 document.

</scalar-step>
<scalar-step title="Add a view that renders Scalar">

```python
# docs/views.py
from django.http import HttpResponse

SCALAR_HTML = """<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module">
      import { createApiReference } from 'https://cdn.jsdelivr.net/npm/@scalar/api-reference/esm.js'

      createApiReference('#app', {
        url: '/api/schema/',
      })
    </script>
  </body>
</html>"""


def scalar_docs(request):
    return HttpResponse(SCALAR_HTML)
```

This is the ESM build from Scalar's CDN, pointed at the schema URL from the next step. For production, pin a version in the CDN URL (for example `@scalar/api-reference@1.72.1`) so an upstream release cannot change your docs overnight.

</scalar-step>
<scalar-step title="Wire up the URLs">

```python
# urls.py
from django.urls import path
from drf_spectacular.views import SpectacularAPIView

from docs.views import scalar_docs

urlpatterns = [
    # ... your existing routes
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', scalar_docs, name='docs'),
]
```

Run `python manage.py runserver` and open `http://localhost:8000/api/docs/`.

</scalar-step>
</scalar-steps>

If you would rather commit the document and review changes in pull requests, generate a file with `./manage.py spectacular --color --file schema.yml`, serve it as a static file, and change `url` to match.

## See it live

The Scalar Galaxy demo is the same renderer on an example API with authentication, schemas, and webhooks. Try search, the generated code samples, and the "Test Request" button.

<scalar-button
  title="Open the live demo"
  href="https://galaxy.scalar.com/"
  icon="phosphor/regular/rocket-launch">
</scalar-button>

## What you get

**An API reference that follows your serializers.** Every change to a serializer, viewset, or `@extend_schema` decorator shows up in the reference on the next request, because the page reads drf-spectacular's live schema. Code samples are generated for common languages and HTTP clients.

**Django's own access control.** The docs are an ordinary Django view, so `login_required`, `staff_member_required`, or your own permission decorator protect them the way they protect anything else.

**An API client.** Each operation has a "Test Request" button that opens the [Scalar API client](/products/api-client), prefilled with parameters and the security schemes your document declares. Session and token auth from DRF show up there if drf-spectacular describes them.

**SDKs.** The [Scalar SDK generator](/products/sdk-generator) reads the same schema. The Python, TypeScript, Go, and CLI targets are generally available, so a Python client for your Django API is a supported path. Java, Kotlin, Ruby, C#, PHP, Rust, Swift, Dart, and C++ are experimental. Every plan includes one SDK.

**A hosted MCP server.** Scalar can host an [MCP server](/products/agent/mcp) generated from your OpenAPI document, with OAuth, so AI agents can call the endpoints you pick. Scalar runs it; you do not add MCP code to your Django project. Hosted MCP servers are included from the Pro plan.

The renderer is MIT licensed and free to self-host. Hosted docs, SDKs, and MCP servers are listed on the [pricing page](/pricing).

## Migrating from Swagger UI or Redoc

drf-spectacular ships `SpectacularSwaggerView` and `SpectacularRedocView`. Both render the schema served by `SpectacularAPIView`, which is the same schema Scalar reads. Moving over is a URL change:

1. Keep `path('api/schema/', SpectacularAPIView.as_view(), name='schema')` exactly as it is.
2. Add the `scalar_docs` view next to your existing Swagger UI or Redoc route and compare them side by side.
3. When you are happy, point the old path (for example `api/schema/swagger-ui/`) at `scalar_docs`, or redirect it, so existing bookmarks still work.

Your `SPECTACULAR_SETTINGS`, `@extend_schema` decorators, and any postprocessing hooks keep working, because none of them depend on the UI. There is more detail in the [Swagger UI migration guide](/resources/migration/swagger-ui).

## Frequently asked questions

<scalar-detail title="Is there an official Scalar package for Django REST Framework?">
No. For DRF, Scalar is rendered from a plain HTML view, as shown above, and the OpenAPI document comes from drf-spectacular. There is an official package for Django Ninja, `scalar-ninja`, and the Scalar docs include a community-contributed DRF setup that also adds django-filter parameters.
</scalar-detail>

<scalar-detail title="Does Scalar work with drf-yasg?">
Scalar renders OpenAPI 3.x and Swagger 2.0 documents, and Swagger 2.0 documents are upgraded on load. drf-yasg produces Swagger 2.0, so pointing `url` at its JSON endpoint works. For new projects, drf-spectacular is the better fit because it produces OpenAPI 3.
</scalar-detail>

<scalar-detail title="Can I avoid loading Scalar from a CDN?">
Yes. Install `@scalar/api-reference` from npm, copy its browser build into your static files, and import it from your own origin. The configuration passed to `createApiReference` stays the same.
</scalar-detail>

<scalar-detail title="How do I restrict the docs to staff users?">
Wrap the view: decorate `scalar_docs` with `staff_member_required` or `login_required`. Remember to protect `SpectacularAPIView` too, since the schema itself describes your API.
</scalar-detail>

<scalar-detail title="What does it cost?">
The API reference is MIT licensed and free to run inside your Django app. Hosted Scalar docs start free; Pro is $150 per month and Business is $600 per month.
</scalar-detail>

## Get started

```bash
pip install drf-spectacular
```

Then add the view above, or [create a free Scalar account](https://dashboard.scalar.com/register) and upload the `schema.yml` from `./manage.py spectacular` to host it.

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0)
- **Docs:** [Django integration reference](/products/api-references/integrations/django)
- **Product:** [Scalar API References](/products/api-references) — the open-source renderer embedded in your Django view
