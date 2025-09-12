import { type InjectionKey, inject, provide } from 'vue'

/**
 * Tells a ScalarFormInput component that it is in a form group.
 */
export const FORM_GROUP_SYMBOL = Symbol() as InjectionKey<boolean>

/**
 * Check if we're in a form group.
 *
 * This is called from ScalarFormInput components.
 */
export const useFormGroupInput = () => {
  return inject(FORM_GROUP_SYMBOL, false)
}

/**
 * Set that this is a form group.
 *
 * This is called from ScalarFormInputGroup components.
 */
export const useFormGroup = () => {
  provide(FORM_GROUP_SYMBOL, true)
}
