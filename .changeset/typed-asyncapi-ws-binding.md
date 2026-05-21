---
'@scalar/schemas': patch
'@scalar/types': patch
---

feat: add typed AsyncAPI WebSocket binding schema

- Add `asyncApiWsBindingObject` for `bindings.ws` with `method`, `query`, `headers`, and `bindingVersion`
- Add `asyncApiSchemaObjectOrReference` (Schema Object | Reference Object) for WebSocket binding fields that exclude Multi Format Schema Object
- Regenerate `@scalar/types/asyncapi/3.1` types
