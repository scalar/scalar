import type { MaybeRefOrGetter } from 'vue'

/**
 * Vue class prop type
 *
 * Vue seems to just use any behind the scenes
 *
 * @see https://vuejs.org/guide/essentials/class-and-style.html#class-and-style-bindings
 */
export type VueClassProp = MaybeRefOrGetter<
  string | Record<string, boolean> | (string | Record<string, boolean>)[] | false
>
