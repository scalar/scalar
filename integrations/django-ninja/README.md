# Scalar API Reference for Django Ninja

[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

The easiest way to render a modern and beautiful API reference based on your Django Ninja OpenAPI document.

![django-ninja](ninja.png)

## Installation

```bash
pip install git+https://github.com/scalar/scalar.git#subdirectory=integrations/django-ninja
```

## Usage

Integrating Scalar with Django Ninja is simple.
Just pass the `ScalarViewer` instance to the `docs` parameter of the NinjaAPI instance.

```python
from ninja import NinjaAPI
from scalar_django_ninja import ScalarViewer

api = NinjaAPI(
    version="1.0.0",
    title="API Reference",
    description="API Reference for the Scalar Django Ninja Plugin",
    docs=ScalarViewer(),
    docs_url="/docs/",
)

@api.get("/add")
def add(request, a: int, b: int):
    return {"result": a + b}


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]

```

This renders a beautiful API reference at `/api/docs` based on your API.

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
