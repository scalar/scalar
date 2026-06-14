# AsyncAPI Specification

We're in the process of adding [AsyncAPI](https://www.asyncapi.com/) support.

You can load AsyncAPI documents the same way you load OpenAPI documents:

```javascript
Scalar.createApiReference('#app', {
  url: '/asyncapi.json'
})
```

## What renders

The reference renders the AsyncAPI document grouped by channel. For each channel you'll see:

- The channel title (or address) and description.
- The channel address **parameters**.
- Each **operation** on the channel, nested beneath it, with its `send`/`receive` action, title, and summary/description.
- Each **message** under its operation, shown as a collapsible accordion. Expanding a message reveals its description and its **headers** and **payload** schemas. Messages start collapsed and stay in sync with the sidebar, so selecting a message in the navigation (or opening a deep link to it) expands it here too.

Reusable schemas defined under `components.schemas` are rendered in the **Models** section, just like OpenAPI.

Rendering works in both the `modern` and `classic` layouts.

> [!NOTE]
> AsyncAPI support is still a work in progress, so not every part of the specification is rendered yet. The progress is tracked on GitHub in [issue #7080](https://github.com/scalar/scalar/issues/7080) — subscribe there to receive updates.
