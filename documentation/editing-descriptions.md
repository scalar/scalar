# Editing Descriptions

Scalar can let a reader edit a description in the reference itself and hand the new text to
your application to store. The reference supplies the editing surface and nothing else: it
does not store anything, does not know where the text belongs, and does not decide who is
allowed to edit.

This is aimed at API descriptions that are **generated from code**. When a document comes out
of springdoc, FastAPI, NestJS, Swashbuckle or similar, the prose lives in annotations beside
the handlers, so improving a description means a code change, a review and a deploy — and the
people who notice that a description reads badly are often not the people who can change it.
Keeping the prose in your own store and merging it into the generated document lets those
edits happen without a release.

If your document is a file you maintain by hand, you probably do not want this. Editing the
file is simpler and you already have version control.

## How it fits together

Editing is a round trip between your application and the reference:

1. Your application generates or loads the OpenAPI document.
2. It merges any prose it has already stored into that document.
3. It stamps an `x-scalar-edit-key` onto every object whose description may be edited, and
   serves the result.
4. The reference shows an edit control beside each of those descriptions.
5. A reader edits one and saves. The reference calls `onDescriptionUpdate` with that object's
   key and the new text, and updates the page so it stays consistent.
6. Your application stores the text against the key. The next time the document is served,
   step 2 puts it back.

Step 6 is what makes an edit durable. The update the reference makes in step 5 only keeps the
current page consistent — nothing is persisted, and a reload shows whatever the document says.

## What each side owns

The reference:

- renders the edit control, but only where both an `x-scalar-edit-key` and the
  `onDescriptionUpdate` callback are present,
- passes the key back untouched,
- updates the in-memory document after a successful save so the page reflects it,
- keeps the editor open, with the draft intact, if the callback throws or rejects.

Your application:

- chooses the addressing scheme and mints the keys,
- decides who may edit, and enforces it on the endpoint the callback calls — the reference
  will show the control to anyone who loads a document containing keys, so a document with
  keys should only be served to people allowed to edit,
- stores the text and merges it back in on the next render,
- handles anything the reference deliberately leaves out: history, review, concurrent edits,
  and validating that the markdown is what you want to publish.

## Keys

An `x-scalar-edit-key` is an opaque string. The reference never parses it, so it can be
whatever your store already uses: a JSON Pointer, a flat key, a database id.

```yaml
openapi: 3.1.0
info:
  title: Planets
  version: 1.0.0
paths:
  /planets:
    get:
      summary: Get all planets
      description: Every planet we know of.
      x-scalar-edit-key: paths/~1planets/get
      responses:
        '200':
          description: OK
          x-scalar-edit-key: paths/~1planets/get/responses/200
```

A key may go on any object that carries a `description`: `info`, entries in `tags`,
operations, parameters, request bodies, responses, and schemas including their properties.

Two things are worth knowing when you mint them:

**Stamp the object, not the description.** The key identifies the thing that owns the text, so
your callback appends the field name when it stores the value. One key per object means a
position with no description yet still gets an edit control, and the same key can later
address other fields on that object.

**A `$ref` resolves before the key is read.** If a schema is defined under `components` and
used through a `$ref`, stamp the component. Editing it anywhere it is used then lands on the
component, and every usage shows the change.

Because your application already walks the document to merge stored prose into it, stamping is
usually the same walk writing keys instead of reading them.

## Wiring it up

Set [`onDescriptionUpdate`](./configuration.md#ondescriptionupdate). Its presence is what turns
editing on.

```js
Scalar.createApiReference('#app', {
  url: '/openapi.yaml',
  onDescriptionUpdate: async ({ key, value }) => {
    const response = await fetch('/descriptions', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })

    if (!response.ok) {
      throw new Error(`Could not save: ${response.status}`)
    }
  },
})
```

Throwing is how you refuse a save. The message is shown beside the editor and the reader keeps
their draft, so a rejected permission check or a failed write does not cost them their text.

## On the server

A minimal shape, with an Express-style handler. `store` is any key/value store.

```js
// Serve the document: merge stored prose, then stamp keys onto what can be edited.
app.get('/openapi.yaml', async (request, response) => {
  const document = await generateDocument()
  const descriptions = await store.all()

  walk(document, (node, pointer) => {
    if (!isEditable(node)) {
      return
    }

    const key = pointer

    // Anything authored wins over what generation produced.
    if (descriptions[`${key}/description`]) {
      node.description = descriptions[`${key}/description`]
    }

    node['x-scalar-edit-key'] = key
  })

  response.type('yaml').send(toYaml(document))
})

// Receive an edit.
app.put('/descriptions', async (request, response) => {
  if (!mayEditDescriptions(request.user)) {
    return response.sendStatus(403)
  }

  const { key, value } = request.body
  await store.set(`${key}/description`, value)

  response.sendStatus(204)
})
```

Two details this sketch glosses over that are worth handling in earnest:

- **Cache the generated document, and evict it when a description is saved.** Otherwise an
  edit appears to vanish until the cache expires.
- **Address array entries by identity rather than by index.** A key like
  `…/parameters/0` silently points at a different parameter as soon as generation inserts one
  above it, and the stored prose lands on the wrong thing with no error. Something like
  `…/parameters[in=query,name=email]` survives regeneration.

## Serving two audiences

A document containing keys is an invitation to edit, so it is usually right to serve two
versions from the same route: a plain one for readers, and one with keys for people who may
edit. The reference needs no configuration for this — a document without keys shows no edit
controls, whether or not the callback is set.

Keep in mind that this means editors see a slightly different document from everybody else. If
that matters, give them a way to view the published version too.
