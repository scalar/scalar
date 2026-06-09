import type { UseSeoMetaInput, VueHeadClient } from '@unhead/vue'
import { headSymbol } from '@unhead/vue'
import { FlatMetaPlugin } from 'unhead/plugins'
import { inject, onScopeDispose } from 'vue'

/**
 * Apply SEO meta tags to the active unhead instance.
 *
 * This mirrors `@unhead/vue`'s `useSeoMeta`, but resolves the head instance through the public
 * `headSymbol` injection instead of importing the `useSeoMeta` composable directly.
 *
 * Nuxt's `unhead` module rewrites any direct `import { useSeoMeta } from '@unhead/vue'` to its
 * own `#imports` composable and logs a warning whenever it finds such an import in application
 * code (anything resolved outside of `node_modules`). Because this package is linked into Nuxt
 * apps as a workspace dependency, Vite resolves its built files to their real path under
 * `packages/`, so Nuxt treats them as application code and prints:
 *
 *   You are importing from `@unhead/vue` in `.../map-config-to-workspace-store.js`.
 *   Please import from `#imports` instead for full type safety.
 *
 * `headSymbol` is not one of the composables Nuxt rewrites, so importing it keeps the warning
 * away while staying framework-agnostic for every other integration. The head is provided under
 * `headSymbol` by both Nuxt and our own standalone setup (`createHead()` + `app.use(head)`).
 */
export const useSeoMeta = (input: UseSeoMetaInput) => {
  const head = inject<VueHeadClient | null>(headSymbol, null)

  // The head is only missing when the reference renders without an unhead context, for example
  // inside a host app that never installed it. There is nothing to update in that case.
  if (!head) {
    return
  }

  head.use(FlatMetaPlugin)

  const { title, titleTemplate, ...meta } = input

  // `_flatMeta` is the internal input key `FlatMetaPlugin` expands into individual SEO meta tags.
  // This is exactly what `@unhead/vue`'s `useSeoMeta` pushes under the hood.
  const entry = head.push({ title, titleTemplate, _flatMeta: meta } as Parameters<typeof head.push>[0])

  // Remove the entry again when the surrounding effect scope is disposed, matching `useSeoMeta`.
  // `failSilently` keeps this safe when called outside of a component setup (for example on the
  // server), where there is no scope to attach to.
  onScopeDispose(() => entry.dispose(), true)
}
