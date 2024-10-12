<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { computed, ref } from 'vue'

const props = defineProps<{
  id: string
  type?: string
  label?: boolean
}>()

const mask = ref(true)

const inputType = computed(() =>
  props.type === 'password'
    ? mask.value
      ? 'password'
      : 'text'
    : (props.type ?? 'text'),
)

defineOptions({
  inheritAttrs: false,
})
</script>
<template>
  <div class="card-form-input">
    <label
      class="card-form-input-label"
      :class="{ 'sr-only': !label }"
      :for="id">
      <slot />
    </label>
    <input
      v-bind="$attrs"
      :id="id"
      autocomplete="off"
      class="card-form-input-text"
      data-1p-ignore
      spellcheck="false"
      :type="inputType" />
    <label
      v-if="type === 'password'"
      class="card-form-input-mask">
      <span class="sr-only">Hide Password</span>
      <ScalarIcon
        class="card-form-input-mask-icon"
        :icon="mask ? 'Show' : 'Hide'" />
      <input
        v-model="mask"
        :aria-controls="id"
        :aria-expanded="!mask"
        type="checkbox" />
    </label>
  </div>
</template>
<style scoped>
.card-form-input {
  background: transparent;
  position: relative;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: baseline;
  border-color: inherit;
  border-radius: var(--scalar-radius);
}
.card-form-input:has(.card-form-input-text:focus-visible) {
  box-shadow: inset 0 0 0 1px var(--scalar-color-accent);
}
.card-form-input-label,
.card-form-input-text {
  padding: 9px;
  border: 0;
  outline: none;
  font-size: var(--scalar-mini);
  color: var(--scalar-color-2);
  width: 100%;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  left: 0;
}
.card-form-input-text:placeholder,
.card-form-input-text:-ms-input-placeholder,
.card-form-input-text::-webkit-input-placeholder {
  color: var(--scalar-color-3);
  font-family: var(--scalar-font);
}
.card-form-input-label {
  width: fit-content;
  white-space: nowrap;
  cursor: text;
  padding: 9px 0 9px 9px;
  border-radius: var(--scalar-radius);
  font-weight: var(--scalar-semibold);
}
.card-form-input-text {
  position: relative;
  z-index: 99;
  color: var(--scalar-color-1);
}
.card-form-input-text:focus-within {
  /* Remove default outline */
  box-shadow: none;
}
.card-form-input + .card-form-input {
  border-left: var(--scalar-border-width) solid var(--scalar-border-color);
}
.card-form-input-text:not(:placeholder-shown) + label {
  color: var(--scalar-color-2);
}
.card-form-input-mask {
  position: relative;
  padding: 4px;
  margin-right: 6px;
  height: 24px;
  width: 24px;
  align-self: center;
  stroke-width: 0.75;
  color: var(--scalar-color-2);
  border-radius: var(--scalar-radius);
}
.card-form-input-mask:hover {
  color: var(--scalar-color-1);
  background: var(--scalar-background-2);
}
.card-form-input-mask > input {
  position: absolute;
  inset: 0;
  appearance: none;
  border: none;
  cursor: pointer;
}
</style>
