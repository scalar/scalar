import { type InjectionKey, type Ref, inject, provide, ref } from 'vue'

/** The symbol for the dropdown context */
const ACTIVE_SYMBOL = Symbol() as InjectionKey<Ref<string | undefined>>

/** Provides a ref for the currently active dropdown item */
export function useDropdown() {
  const active = ref<string>()
  provide(ACTIVE_SYMBOL, active)

  return { active }
}

/** Injects the ref for the currently active dropdown item */
export function useDropdownItem() {
  const active = inject(ACTIVE_SYMBOL)
  if (!active) {
    console.warn('useDropdownItem must be used within a ScalarDropdown')
  }
  return { active }
}
