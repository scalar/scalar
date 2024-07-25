<script lang="ts" setup>
import type { ModalState } from '@scalar/components'
import type { Spec } from '@scalar/oas-utils'

import SearchModal from './SearchModal.vue'

defineProps<{
  parsedSpec: Spec
  modalState: ModalState
}>()
</script>
<template>
  <SearchModal
    :modalState="modalState"
    :parsedSpec="parsedSpec" />
</template>
