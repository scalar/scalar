<script setup lang="ts">
import { truncate } from '@scalar/helpers/string/truncate'
import { computed } from 'vue'

import { ConfirmationForm } from '@/v2/components/forms'

const { name, warningMessage } = defineProps<{
  /** The name of the item to delete */
  name: string
  /** The warning message to display */
  warningMessage?: string | undefined
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()

/** Condenses the name to 18 characters and adds an ellipsis if it's longer */
const truncatedName = computed(() => truncate(name))
</script>
<template>
  <ConfirmationForm
    :label="`Delete ${truncatedName}`"
    variant="danger"
    @cancel="emit('close')"
    @submit="emit('delete')">
    <p
      v-if="warningMessage"
      class="text-c-2 text-sm leading-normal text-pretty">
      {{ warningMessage }}
    </p>
  </ConfirmationForm>
</template>
