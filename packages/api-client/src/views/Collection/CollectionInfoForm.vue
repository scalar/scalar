<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { computed } from 'vue'

const { activeCollection } = useActiveEntities()
const { collectionMutators } = useWorkspace()

const fields = [
  { label: 'Title', key: 'title', placeholder: 'My Collection' },
  {
    label: 'Description',
    key: 'description',
    placeholder: 'This API is nuts.',
  },
  { label: 'Version', key: 'version', placeholder: '1.0.0' },
]

const updateInfo = (key: string, value: string) => {
  if (!activeCollection?.value?.uid) {
    return
  }

  collectionMutators.updateInfo(activeCollection?.value?.uid, {
    [key]: value,
  })
}

const data = computed(() => {
  return {
    title: activeCollection?.value?.info?.title,
    description: activeCollection?.value?.info?.description,
    version: activeCollection?.value?.info?.version,
  }
})
</script>
<template>
  <Form
    :data="data"
    :onUpdate="updateInfo"
    :options="fields">
    <template #title>
      <span class="text-c-2">Info</span>
    </template>
  </Form>
</template>
