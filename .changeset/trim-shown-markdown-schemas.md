---
'@scalar/openapi-to-markdown': patch
---

Shorten the `## Schemas` section for schemas a page already expanded. Such a model is now a single line, for example `` `Customer` — shown above. ``, instead of a heading, type, "shown above" note and generated example. The line keeps the model's title and any description that a reference sibling replaced where the schema was expanded. A selected model, leaf schemas, models the page has not expanded, and object models with authored examples keep their full sections. A Stripe operation page such as `GET /v1/customers/{customer}` drops from about 2.5 MB to about 1.3 MB, with 819 of its 918 model sections reduced to one line. Everything above `## Schemas` is unchanged.
