<script setup lang="ts">
import { Draggable } from '../../src'

defineProps<{ items: any; id: string; parentIds: string[] }>()
</script>

<template>
  <div>
    {{ items[id].name }}

    <Draggable
      v-for="child in items[id].children"
      :id="child"
      :key="child"
      class="child"
      :parentIds="[...parentIds, id]">
      <SidebarItem
        :id="child"
        :items="items"
        :parentIds="[...parentIds, id]" />
    </Draggable>
  </div>
</template>

<style scoped></style>
