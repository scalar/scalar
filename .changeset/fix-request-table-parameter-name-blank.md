---
'@scalar/api-client': patch
'@scalar/workspace-store': patch
---

Fix parameter name blanking in the Try It panel on first open.

Three related issues caused a parameter name (e.g. `x-scenario-id`) to appear
blank the first time the Try It panel was opened for a GET endpoint:

1. **`RequestTable` used `key: index`** — Vue reused the same `RequestTableRow`
   component instance for the placeholder row `{ name: '' }` that `displayData`
   appends, causing the component to receive an empty `data.name` prop and blank
   its local `name` ref.  Fixed by using a stable identity key derived from the
   parameter name and value path.

2. **`RequestTableRow` watch and blur emitted empty names** — the `watch:name`
   handler unconditionally synced the local ref to the incoming prop (including
   `''`), and `handleKeyBlur` forwarded a blank name emitted by `CodeInputLite`
   before it had rendered its initial value.  Both now guard against overwriting
   a valid name with an empty string.

3. **`upsertOperationParameter` mutated `param.name` unconditionally** — a
   value-only update carrying `payload.name = ''` permanently blanked the
   reactive parameter name in the store.  The mutator now skips the name
   assignment when the payload name is empty and the parameter already has one.
