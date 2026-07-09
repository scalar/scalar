---
'@scalar/types': patch
'@scalar/schemas': patch
---

Type the `hiddenClients` config against the real target and client ids. It was `Record<string, boolean | string[]> | string[] | true`, so there was no autocomplete and no error on a typo. An array entry is now typed as a target (`'node'`), a client name (`'fetch'`), or a full id (`'node/fetch'`), and the record form is keyed by target. Runtime stays permissive, so unknown names are still ignored gracefully as before.
