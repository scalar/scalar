from typing import Union
from fastapi import FastAPI
import sys
import os

# Use the local scalar_fastapi package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from scalar_fastapi import get_scalar_api_reference, Theme

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        theme=Theme.KEPLER,
    )


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
