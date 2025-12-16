import { type InjectionKey, type Reactive, type Ref, inject, provide, reactive, ref } from 'vue'

/** Might be an element or undefined */
export type MaybeElement = Element | undefined | null

export type DropdownContext = {
  /** The id of the currently active dropdown item */
  active: Ref<string | undefined>
  /**
   * The list of dropdown items
   * The id is the key and the value is the element
   */
  items: Reactive<Record<string, HTMLElement>>
}

/** The symbol for the dropdown context */
const CONTEXT_SYMBOL = Symbol() as InjectionKey<DropdownContext>

export function useDropdown() {
  // Create a new context for the dropdown and provide it to any sub-components
  const context: DropdownContext = {
    active: ref<string>(),
    items: reactive({}),
  }
  provide(CONTEXT_SYMBOL, context)

  return context
}

export function useDropdownItem() {
  const context = inject(CONTEXT_SYMBOL)
  if (!context) {
    throw new Error('useDropdownItem must be used within a ScalarDropdown')
  }
  return context
}
