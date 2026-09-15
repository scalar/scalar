from typing import Union
from fastapi import FastAPI
import sys
import os

# Use the local scalar_fastapi package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from scalar_fastapi import add_scalar_reference, Theme

app = FastAPI()

# One line to serve the API reference at /scalar. Any get_scalar_api_reference
# option can be passed through, like the theme below.
add_scalar_reference(app, theme=Theme.KEPLER)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
