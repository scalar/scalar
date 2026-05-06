<script setup lang="ts">
import { computed, type StyleValue } from 'vue'

const props = defineProps<{ art: string; animate?: boolean }>()

const BLINK = 500 // ms - Cursor blink speed
const PRINT = 100 // ms - Text print speed

const lines = computed<string[]>(() => props.art.split('\n'))

const getLineAnimation = (chars: number, row: number): StyleValue => ({
  animationDuration: `${chars * PRINT}ms, ${BLINK}ms`,
  animationTimingFunction: `steps(${chars}), step-end`,
  animationDelay: `${row * PRINT}ms, 0ms`,
  animationIterationCount: `1, ${(((lines.value?.length ?? 0) + (lines.value?.[lines.value?.length - 1]?.length ?? 0) + 5) * PRINT) / BLINK}`,
})
</script>
<template>
  <div
    aria-hidden="true"
    class="ascii-art font-code flex flex-col items-start text-[6px] leading-[7px]"
    :class="{ 'ascii-art-animate': animate }"
    role="presentation"
    inert>
    <span
      v-for="(line, i) in lines"
      :key="i"
      class="inline-block"
      :style="{ width: `calc(${line.length + 1}ch)` }">
      <!-- prettier-ignore -->
      <span
class="inline-block whitespace-pre overflow-hidden"
:style="getLineAnimation(line.length, i)">{{
       line
      }}</span>
    </span>
  </div>
</template>
<style scoped>
.ascii-art-animate .ascii-art-line {
  border-right: 1ch solid transparent;
  animation:
    typewriter 4s steps(1) 1s 1 normal both,
    blinkTextCursor 500ms steps(1) infinite normal;
}

@keyframes typewriter {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
@keyframes blinkTextCursor {
  0% {
    border-right-color: currentColor;
  }
  50% {
    border-right-color: transparent;
  }
}
</style>
