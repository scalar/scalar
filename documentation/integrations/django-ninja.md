# Scalar API Reference for Django Ninja

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

## Guide

Django Ninja is a simple way to create an API for Django and Scalar provides an easy way to generate a reference document and client for that API.

### Creating a Django Ninja API

Start by creating a virtual environment and activating it:

```bash
python -m venv myenv
myenv\Scripts\activate (windows)
source myenv/bin/activate (mac)
```

Next, install Django Ninja (this installs Django as well):

```bash
pip install django-ninja
```

After installing, create a new Django project:

```bash
django-admin startproject apidemo
```

In `apidemo/apidemo/urls.py`, set up your API with a couple endpoints:

```python
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI

api = NinjaAPI()

@api.get("/add")
def add(request, a: int, b: int):
    return {"result": a + b}

@api.get("/reverse")
def reverse_string(request, text: str):
    return {"result": text[::-1]}

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]

```

We’ll save running it for after we install Scalar in the next section.

### Installing the Scalar API Reference

Next, we need to install Scalar API Reference:

```bash
pip install git+https://github.com/scalar/scalar.git#subdirectory=packages/scalar_django_ninja
```

With Scalar installed, we can import and pass the `ScalarViewer()` object to your API and set the docs URL to `/docs/` like this:

```python
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from scalar_django_ninja import ScalarViewer

api = NinjaAPI(
    version="1.0.0",
    title="API Reference",
    description="API Reference for the Scalar Django Ninja Plugin",
    docs=ScalarViewer(),
    docs_url="/docs/"
)

@api.get("/add")
def add(request, a: int, b: int):
    return {"result": a + b}

@api.get("/reverse")
def reverse_string(request, text: str):
    return {"result": text[::-1]}

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
```

Once done, we are ready to go our `apidemo` directory and run the server.

```bash
cd apidemo
./manage.py runserver
```

Once its running, we can then go to `http://127.0.0.1:8000/api/docs/` to view our API Reference.

![Django Ninja API reference](https://github.com/user-attachments/assets/10a1778a-efa0-4903-b0cb-974ea4135982)

This gives you easy access to the Scalar API client to debug and test any of your API routes as well.
