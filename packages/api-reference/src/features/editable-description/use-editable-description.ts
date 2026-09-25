import { isObject } from '@scalar/helpers/object/is-object'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { type InjectionKey, type Ref, inject, provide, ref } from 'vue'

/**
 * The extension that marks an object as editable.
 *
 * Its value is opaque: the reference hands it back to the host through `onDescriptionUpdate` and
 * never interprets it. That keeps every opinion about addressing (JSON pointers, flat keys, ids) on
 * the host's side, where the document is stored.
 */
export const EDIT_KEY_EXTENSION = 'x-scalar-edit-key'

type OnDescriptionUpdate = NonNullable<ApiReferenceConfiguration['onDescriptionUpdate']>

export const DESCRIPTION_EDITING_SYMBOL: InjectionKey<Ref<OnDescriptionUpdate | undefined>> = Symbol()

/**
 * Reads the edit key off an object, looking through a `$ref` first.
 *
 * A schema shown under a request body is usually a reference to a component, and the key belongs
 * to the component: editing the description where the schema is used has to land on the thing
 * that is shared, not on the reference to it.
 */
export const getEditKey = (target: unknown): string | undefined => {
  const key = resolveEditTarget(target)?.[EDIT_KEY_EXTENSION]

  return typeof key === 'string' && key.length > 0 ? key : undefined
}

/** The object a description is read from and written to: the target itself, or what its `$ref` points at. */
export const resolveEditTarget = (target: unknown): Record<string, unknown> | undefined => {
  if (!isObject(target)) {
    return undefined
  }

  const resolved = getResolvedRef<Record<string, unknown>>(target)

  return isObject(resolved) ? resolved : undefined
}

/** Makes the configured callback available to every description in the tree. */
export const provideDescriptionEditing = (onDescriptionUpdate: Ref<OnDescriptionUpdate | undefined>): void => {
  provide(DESCRIPTION_EDITING_SYMBOL, onDescriptionUpdate)
}

/**
 * Editing is on for an object only when the host has asked for it (the callback is configured) and
 * the object says where it lives (it carries a key). Either alone renders exactly as before.
 */
export const useEditableDescription = () => {
  const onDescriptionUpdate = inject(DESCRIPTION_EDITING_SYMBOL, ref(undefined))

  const canEdit = (target: unknown): boolean => Boolean(onDescriptionUpdate.value) && getEditKey(target) !== undefined

  return { onDescriptionUpdate, canEdit }
}
