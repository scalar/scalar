# API Reference Editor

Scalar API references with an integrated editor. The editor can be used in two ways:

## Internal State Management

You (optionally) provide an initial value and the editor will manage any changes internally.

```html
<!doctype html>
<html>
  <head>
    <title>API Reference Editor</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
    <!-- TODO: Update import script -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference-editor"></script>
  </head>
  <body>
    <div id="scalar-api-reference" />
    <script>
      import { mountApiReferenceEditable } from '@scalar/api-reference-editor'

      mountApiReferenceEditable('#scalar-api-reference')
    </script>
  </body>
</html>
```

## External State Management

To have additional control over when the references are updated you can provide a `configuration.spec.content` value and then handle the custom event that is emitted from the Editor component. A handler can be passed directly to the mountApiReferenceEditable function or you can attach an event listener for `scalar-update` to the mounted div.

If you wish to have external UI that updates the spec then `updateSpecValue` can be used to force update the content.

```html
<!doctype html>
<html>
  <head>
    <title>API Reference Editor</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
    <!-- TODO: Update import script -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference-editor"></script>
  </head>
  <body>
    <div id="scalar-api-reference" />
    <script>
      import { mountApiReferenceEditable } from '@scalar/api-reference-editor'

      const externalState = {
        value: ''
      }

      const { updateSpecValue} = mountApiReferenceEditable(
        '#scalar-api-reference',
        { content: '' },
        (v: string) => {
          console.log('The value is updated!')
          updateSpecValue(v) // Updates the rendered spec
          externalState.value = v
        }
      )
    </script>
  </body>
</html>
```
