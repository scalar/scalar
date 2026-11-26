import type { InjectionKey, ShallowRef } from 'vue'

import type { ResponsePropertyLink } from './id-routing'

/** The active response property navigation for one mounted API Reference. */
export const RESPONSE_PROPERTY_TARGET: InjectionKey<ShallowRef<ResponsePropertyLink | undefined>> =
  Symbol('response-property-target')
