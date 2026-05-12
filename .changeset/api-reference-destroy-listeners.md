---
'@scalar/api-reference': patch
---

fix(api-reference): clean up deprecated document listeners on destroy

`createApiReference()` registered three document-level listeners
(`scalar:reload-references`, `scalar:destroy-references`,
`scalar:update-references-config`) but `destroy()` only unmounted the
Vue app — the listeners stayed attached forever. In environments that
mount and destroy instances repeatedly (notably the Astro integration's
`renderMode="client"` with view transitions), each navigation leaked
three permanent listeners on `document`.

Tie the listeners to an `AbortController` and abort it from `destroy()`
so they all come off in one shot.
