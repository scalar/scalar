---
'@scalar/api-reference': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

feat(api-reference): in-page description editing via `onDescriptionUpdate`

Adds an `onDescriptionUpdate` configuration callback. When it is set, every object in the document that carries an `x-scalar-edit-key` extension shows an edit control next to its description (info, tags, operations, parameters, request bodies, responses, and schemas). Saving calls the callback with the object's key and the new text, and updates the rendered document in place. The reference never interprets the key, so the host decides how descriptions are addressed and stored.
