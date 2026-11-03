<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarModal, type ModalState } from '@scalar/components/modal'
import { isObject } from '@scalar/helpers/object/is-object'
import { safeRun } from '@scalar/helpers/types/safe-run'
import { ScalarIconFileText } from '@scalar/icons'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

const { state, document } = defineProps<{
  state: ModalState
  document?: string
}>()
const emit = defineEmits<{ confirm: [] }>()
const { translate } = useLocalization()
const info = computed(() => {
  const result = safeRun<unknown>(() => JSON.parse(document ?? '{}'))
  const data =
    result.ok && isObject(result.data) && isObject(result.data.info)
      ? result.data.info
      : {}
  return {
    title: typeof data.title === 'string' ? data.title : '',
    version: typeof data.version === 'string' ? data.version : '',
  }
})

const confirm = (): void => {
  state.hide()
  emit('confirm')
}
</script>

<template>
  <ScalarModal
    bodyClass="p-5 pt-4 overflow-y-auto"
    class="[&_.scalar-modal-header]:px-5 [&_.scalar-modal-header]:pt-5 [&_.scalar-modal-header]:text-lg"
    size="xs"
    :state
    :title="translate('developerTools.confirmShareTitle')">
    <div class="text-sm leading-relaxed">
      <div
        v-if="info.title || info.version"
        class="text-c-2 mb-5 flex items-start gap-2">
        <ScalarIconFileText
          aria-hidden="true"
          class="mt-0.5 size-4 shrink-0" />
        <span class="min-w-0 break-words">
          <span class="text-c-1 font-medium">{{ info.title }}</span>
          <span
            v-if="info.version"
            class="ml-2"
            >{{ info.version }}</span
          >
        </span>
      </div>
      <p class="text-c-2">
        {{ translate('developerTools.confirmShareDescription') }}
      </p>
      <div class="mt-4 space-y-1">
        <p class="text-c-1 font-medium">
          {{ translate('developerTools.confirmShareAccess') }}
        </p>
        <p class="text-c-2">
          {{ translate('developerTools.temporaryLinkExpiration') }}
        </p>
      </div>
      <p class="text-c-2 mt-4">
        {{ translate('developerTools.confirmShareWarning') }}
      </p>
      <div class="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4">
        <ScalarButton
          variant="outlined"
          @click="state.hide()">
          {{ translate('developerTools.cancelShare') }}
        </ScalarButton>
        <ScalarButton @click="confirm">
          {{ translate('developerTools.confirmShare') }}
        </ScalarButton>
      </div>
    </div>
  </ScalarModal>
</template>
