# Scalar API Reference for Django

Community member [m1guer](https://github.com/m1guer/django-scalar) wrote code to use the Scalar API Reference in a Django project built with Django Rest Framework.

:::scalar-callout{ type=info }
If you are using Django Ninja, then follow the [Django Ninja guide](django-ninja) instead.
:::

## Basic Setup

This requires you to set up the apps `rest_framework`, `drf_spectacular`, and optionally `django_filters`.

Once those are installed, create a new folder in the top level of your project called `scalar` with three files.

The first is `get_filter_parameters.py` which will automatically generate an OpenAPI parameter specification from `django-filter`.

```python
# scalar/get_filter_parameters.py
from typing import Type, List
from django_filters import FilterSet
from drf_spectacular.utils import OpenApiParameter
from django_filters.filters import (
    CharFilter,
    NumberFilter,
    DateFilter,
    BooleanFilter,
    ChoiceFilter,
    ModelChoiceFilter,
)
from rest_framework.fields import DecimalField

def get_filter_parameters(filter_class: Type[FilterSet]) -> List[OpenApiParameter]:
    """
    Automatically generate OpenAPI parameters from a FilterSet class.
    Args:
        filter_class: The FilterSet class to generate parameters from
    Returns:
        List of OpenApiParameter objects
    """
    parameters = []

    for field_name, filter_instance in filter_class().filters.items():
        parameter_type = str  # default type
        parameter_format = None
        enum = None

        # Determine parameter type based on filter type
        if isinstance(filter_instance, NumberFilter):
            parameter_type = (
                float if isinstance(filter_instance.field, DecimalField) else int
            )
        elif isinstance(filter_instance, BooleanFilter):
            parameter_type = bool
        elif isinstance(filter_instance, DateFilter):
            parameter_type = str
            parameter_format = "date"
        elif isinstance(filter_instance, ChoiceFilter):
            parameter_type = str
            enum = [choice[0] for choice in filter_instance.extra["choices"]]
        elif isinstance(filter_instance, ModelChoiceFilter):
            parameter_type = int
            description = (
                f"ID of related {filter_instance.field.queryset.model.__name__}"
            )

        # Get lookup expression for description
        lookup_expr = getattr(filter_instance, "lookup_expr", "exact")

        # Build description
        if lookup_expr == "icontains":
            description = f"Filter by {field_name} (case-insensitive, partial match)"
        elif lookup_expr == "gte":
            description = f"Filter by {field_name} (greater than or equal)"
        elif lookup_expr == "lte":
            description = f"Filter by {field_name} (less than or equal)"
        elif lookup_expr == "iexact":
            description = f"Filter by exact {field_name} (case-insensitive)"
        else:
            description = f"Filter by {field_name}"

        # Create parameter
        param = OpenApiParameter(
            name=field_name,
            type=parameter_type,
            location="query",
            description=description,
            required=False,
            enum=enum,
        )

        parameters.append(param)
      return parameters
```

Second, set up a `scalar.py` file with all the details you need to view the Scalar API Reference.

```python
# scalar/scalar.py
from django.http import HttpResponse
from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

def scalar_viewer(request):
    openapi_url = "/api/schema/"
    title = "Scalar Api Reference"
    scalar_js_url = "https://cdn.jsdelivr.net/npm/@scalar/api-reference"
    scalar_proxy_url = ""
    scalar_favicon_url = "/static/favicon.ico"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{title}</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="shortcut icon" href="{scalar_favicon_url}">
        <style>
        body {{
            margin: 0;
            padding: 0;
        }}
        </style>
    </head>
    <body>
        <noscript>
            Scalar requires Javascript to function. Please enable it to browse the documentation.
        </noscript>
        <script
            id="api-reference"
            data-url="{openapi_url}"
            data-proxy-url="{scalar_proxy_url}"
            >
        </script>
        <script src="{scalar_js_url}"></script>
    </body>
    </html>
    """
    return HttpResponse(html)

urlpatterns_scalar = [
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", scalar_viewer, name="docs"),
]
```

Last, we need an `__init__.py` file so we can import these in our other files:

```python
from .scalar import urlpatterns_scalar
from .get_filter_parameters import get_filter_parameters

__all__ = ['urlpatterns_scalar', 'get_filter_parameters']
```

Now, we can import and use these elsewhere in our Django app.

## Integrating Scalar with the Django project

With the logic for Scalar set up, you can import and add `get_filter_parameters` to your views like this:

```python
# products/views.py
from rest_framework import viewsets
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import Product
from .serializers import ProductSerializer
from .filters import ProductFilter
from scalar.get_filter_parameters import get_filter_parameters

@extend_schema(tags=['Products'])
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filterset_class = ProductFilter

    @extend_schema(
        description="List all products",
        parameters=get_filter_parameters(ProductFilter)
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
```

In your project's `urls.py` file, you can add the Scalar viewer to the URL patterns:

```python
# myapi/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from scalar.scalar import urlpatterns_scalar
from products.views import ProductViewSet

router = DefaultRouter()
router.register('products', ProductViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
] + urlpatterns_scalar

```

When you run your Django server, you'll see the Scalar API Reference at `http://localhost:8000/api/docs/`.
