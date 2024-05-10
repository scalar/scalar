<script setup lang="ts">
import { type StyleValue, computed } from 'vue'

const props = defineProps<{ art: string }>()

const lines = computed<string[]>(() => props.art.split('\n'))
</script>
<template>
  <div class="ascii-art">
    <span
      v-for="(line, i) in lines"
      :key="i"
      class="ascii-art-line-wrapper"
      :style="{ width: `calc(${line.length + 1}ch)` }">
      <!-- prettier-ignore -->
      <span class="ascii-art-line">{{
       line
      }}</span>
    </span>
  </div>
</template>
<style scoped>
.ascii-art {
  font-family: var(--scalar-font-code);
  font-weight: var(--scalar-bold);
  font-size: 6px;
  color: var(--scalar-color-3);
  line-height: 7px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.ascii-art-line-wrapper {
  display: inline-block;
}
.ascii-art-line {
  display: inline-block;
  white-space: pre;
  overflow: hidden;
}
</style>
