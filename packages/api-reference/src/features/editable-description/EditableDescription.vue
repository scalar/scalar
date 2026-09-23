<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarMarkdown } from '@scalar/components/markdown'
import { ScalarTextArea } from '@scalar/components/text-area'
import { ScalarIconPencil } from '@scalar/icons'
import { computed, ref, useAttrs, watch } from 'vue'

import { useLocalization } from '@/features/localization'

import {
  getEditKey,
  resolveEditTarget,
  useEditableDescription,
} from './use-editable-description'

/**
 * A description that the reader can edit in place.
 *
 * Wraps `ScalarMarkdown` and adds nothing unless the host configured
 * `onDescriptionUpdate` and `target` carries an `x-scalar-edit-key`; without
 * both, it renders the markdown exactly as before. Any other attribute is
 * forwarded to the markdown, so a call site swaps the component name and
 * keeps its props.
 */
const { target, value } = defineProps<{
  /**
   * The object whose `description` is being edited. The key is read off it,
   * the saved text is written back to it.
   */
  target?: unknown
  /**
   * What to show when not editing. Defaults to the target's description;
   * a call site passes this when the displayed text is derived (for example
   * a type-based fallback), so the draft still starts from the real value.
   */
  value?: string | null
}>()

defineOptions({ inheritAttrs: false })

/**
 * `class` stays on whichever element is the root, so the call site's styling
 * lands on the wrapper once there is one; everything else is for the markdown.
 */
const attrs = useAttrs()
const rootClass = computed(() => attrs.class)
const markdownAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const { translate } = useLocalization()
const { onDescriptionUpdate, canEdit } = useEditableDescription()

const isEditing = ref(false)
const isSaving = ref(false)
const draft = ref('')
const error = ref<string | null>(null)

/** The description as stored, read through a `$ref` so a shared schema shows its own text. */
const storedDescription = computed<string>(() => {
  const description = resolveEditTarget(target)?.description
  return typeof description === 'string' ? description : ''
})

/**
 * What was last saved here. The schema tree reads its nodes outside Vue's
 * tracking on purpose (see `unwrap-for-read.ts`), so a write to the document
 * is not enough to refresh a derived `value`; this keeps the text on screen
 * until the tree renders from the document again.
 */
const savedValue = ref<string | null>(null)
watch(
  () => target,
  () => {
    savedValue.value = null
  },
)

const displayValue = computed<string>(
  () => savedValue.value ?? value ?? storedDescription.value,
)

const isEditable = computed(() => canEdit(target))

const startEditing = (): void => {
  draft.value = savedValue.value ?? storedDescription.value
  error.value = null
  isEditing.value = true
}

const cancel = (): void => {
  isEditing.value = false
  error.value = null
}

const save = async (): Promise<void> => {
  const key = getEditKey(target)
  const callback = onDescriptionUpdate.value

  if (!key || !callback) {
    return
  }

  isSaving.value = true
  error.value = null

  try {
    await callback({ key, value: draft.value })

    // The document is reactive, so writing back here is what re-renders every
    // place this object is shown, not only this one.
    const resolved = resolveEditTarget(target)
    if (resolved) {
      resolved.description = draft.value
    }

    savedValue.value = draft.value
    isEditing.value = false
  } catch (thrown) {
    // The draft is kept on purpose: a failed save must not cost the reader their text.
    error.value =
      thrown instanceof Error && thrown.message
        ? thrown.message
        : translate('editing.failed')
  } finally {
    isSaving.value = false
  }
}

const onKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    event.preventDefault()
    cancel()
  } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    void save()
  }
}
</script>

<!--
  Every branch is a single root element on purpose. A component with more than one
  possible root is a fragment, and Vue cannot pass a parent's scoped-style id through
  a fragment — call sites style these descriptions with scoped rules, so a fragment
  here silently drops their font size and spacing.
-->
<template>
  <ScalarMarkdown
    v-if="!isEditable && !$slots.default"
    v-bind="attrs"
    :value="displayValue" />
  <div
    v-else-if="!isEditable"
    :class="rootClass">
    <slot />
  </div>
  <div
    v-else-if="!isEditing"
    class="editable-description group/editable relative pr-6"
    :class="rootClass">
    <slot>
      <ScalarMarkdown
        v-if="displayValue"
        v-bind="markdownAttrs"
        :value="displayValue" />
      <p
        v-else
        class="text-c-3 m-0 italic">
        {{ translate('editing.empty') }}
      </p>
    </slot>
    <ScalarIconButton
      class="editable-description-edit text-c-3 hover:text-c-1 absolute -top-0.5 -right-1 opacity-60 group-hover/editable:opacity-100 focus-visible:opacity-100"
      :icon="ScalarIconPencil"
      :label="translate('editing.edit')"
      size="xs"
      @click="startEditing" />
  </div>
  <div
    v-else
    class="editable-description editable-description-editing flex flex-col gap-2"
    :class="rootClass"
    @keydown="onKeydown">
    <ScalarTextArea
      v-model="draft"
      :aria-label="translate('editing.edit')"
      autofocus
      class="min-h-24 w-full rounded border px-2 py-1.5 font-mono text-sm" />
    <div class="flex items-center gap-2">
      <ScalarButton
        :disabled="isSaving"
        size="sm"
        @click="save">
        {{ translate('editing.save') }}
      </ScalarButton>
      <ScalarButton
        :disabled="isSaving"
        size="sm"
        variant="outlined"
        @click="cancel">
        {{ translate('editing.cancel') }}
      </ScalarButton>
      <span
        v-if="error"
        class="text-red text-sm"
        role="alert">
        {{ error }}
      </span>
    </div>
  </div>
</template>
