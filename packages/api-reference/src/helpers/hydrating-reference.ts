import type { InjectionKey, Ref } from 'vue'

/** True only while this reference hydrates the full document rendered by the server. */
export const HYDRATING_REFERENCE: InjectionKey<Ref<boolean>> = Symbol('hydrating-reference')
