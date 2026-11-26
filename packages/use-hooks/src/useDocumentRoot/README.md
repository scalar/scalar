# Scalar useDocumentRoot Hook

Gets the DOM root a component renders into: the `document`, or a shadow root when Scalar is embedded in a web component.

Inside a shadow root, `document.getElementById`, `document.querySelector` and `document.activeElement` do not see the shadow tree. Look things up on the root instead.

## Providing the root

Whatever mounts Scalar into a shadow root provides it. Separately mounted apps do not inherit provides, so they provide it again.

```ts
import { DOCUMENT_ROOT_SYMBOL } from '@scalar/use-hooks/useDocumentRoot'

app.provide(DOCUMENT_ROOT_SYMBOL, mountingElement.getRootNode() as Document | ShadowRoot)
```

## Using the root

```vue
<script setup lang="ts">
import { getActiveElement } from '@scalar/helpers/dom/get-active-element'
import { isShadowRoot } from '@scalar/helpers/dom/is-shadow-root'
import { useDocumentRoot } from '@scalar/use-hooks/useDocumentRoot'

const root = useDocumentRoot()

const focusSearch = () => root?.getElementById('search')?.focus()
const hasFocus = (el: Element) => getActiveElement(root) === el
const isEmbedded = isShadowRoot(root)
</script>
```

Without a provided root it returns `document`, and `undefined` during SSR.
