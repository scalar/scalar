<script setup lang="ts">
import { ScalarCodeBlock, ScalarVirtualText } from '@scalar/components'
import { computed, useId } from 'vue'

const { schemaContent } = defineProps<{
  schemaContent: string
}>()

const VIRTUALIZATION_THRESHOLD = 20_000

const id = useId()

const shouldVirtualizeSchema = computed(() => {
  return schemaContent.length > VIRTUALIZATION_THRESHOLD
})
</script>

<template>
  <ScalarCodeBlock
    v-if="!shouldVirtualizeSchema"
    :id="id"
    class="bg-b-2"
    :content="schemaContent"
    lang="json" />
  <ScalarVirtualText
    v-else
    :id="id"
    containerClass="custom-scroll scalar-code-block border rounded-b flex flex-1 max-h-screen"
    contentClass="language-plaintext whitespace-pre font-code text-base"
    :lineHeight="20"
    :text="schemaContent" />
</template>
