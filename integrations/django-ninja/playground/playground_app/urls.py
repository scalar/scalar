"""
URL configuration for playground_app project.
"""

from django.urls import path
from ninja import NinjaAPI, Schema
from typing import Union

from scalar_ninja import ScalarViewer, Theme

# Create API instance with custom docs
api = NinjaAPI(
    title="Playground API",
    version="1.0.0",
    docs=ScalarViewer(
        theme=Theme.KEPLER,
    ),
)


class ItemSchema(Schema):
    name: str
    description: Union[str, None] = None
    price: float


@api.get("/")
def read_root(request):
    """Root endpoint returning a simple greeting."""
    return {"Hello": "World"}


@api.get("/items/{item_id}")
def read_item(request, item_id: int, q: Union[str, None] = None):
    """Get an item by ID with optional query parameter."""
    return {"item_id": item_id, "q": q}


@api.post("/items/")
def create_item(request, item: ItemSchema):
    """Create a new item."""
    return {"item": item.dict(), "created": True}


urlpatterns = [
    path("api/", api.urls),
]
