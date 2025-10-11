<script setup lang="ts">
import { ScalarButton, ScalarModal, type ModalState } from '@scalar/components'

const { state, name } = defineProps<{
  state: ModalState
  name: string
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (event: 'submit'): void
}>()
</script>

<template>
  <ScalarModal
    bodyClass="border-t-0 rounded-t-lg flex flex-col gap-4"
    size="xxs"
    :state="state"
    :title="`Delete ${name}`">
    <p class="text-c-2 text-sm leading-normal text-pretty">
      Are you sure you want to delete this environment? This action cannot be
      undone.
    </p>
    <div class="flex justify-between">
      <ScalarButton
        size="sm"
        variant="outlined"
        @click="
          () => {
            emit('cancel')
            state.hide()
          }
        ">
        Cancel
      </ScalarButton>
      <ScalarButton
        size="sm"
        variant="danger"
        @click="
          () => {
            emit('submit')
            state.hide()
          }
        ">
        Delete Environment
      </ScalarButton>
    </div>
  </ScalarModal>
</template>
