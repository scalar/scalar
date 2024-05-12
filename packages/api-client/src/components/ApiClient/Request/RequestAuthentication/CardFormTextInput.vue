<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components'
import { computed, ref } from 'vue'

const props = defineProps<{
  id: string
  type?: string
}>()

const mask = ref(true)

const inputType = computed(() =>
  props.type === 'password'
    ? mask.value
      ? 'password'
      : 'text'
    : props.type ?? 'text',
)

defineOptions({
  inheritAttrs: false,
})
</script>
<template>
  <div class="card-form-input">
    <label :for="id">
      <slot />
    </label>
    <input
      v-bind="$attrs"
      :id="id"
      autocomplete="off"
      data-1p-ignore
      spellcheck="false"
      :type="inputType" />
    <ScalarIconButton
      v-if="type === 'password'"
      class="password-mask"
      :icon="mask ? 'Show' : 'Hide'"
      :label="mask ? 'Show Password' : 'Hide Password'"
      @click="mask = !mask" />
  </div>
</template>
<style scoped>
:where(.card-form-input) {
  background: transparent;
  position: relative;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: baseline;
  border-color: inherit;
}

.card-form-input label,
.card-form-input input {
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
.card-form-input label {
  color: var(--scalar-color-1);
  width: fit-content;
  white-space: nowrap;
  cursor: text;
  padding: 9px 0 9px 9px;
  border-radius: var(--scalar-radius);
  font-weight: var(--scalar-semibold);
}
.card-form-input input {
  position: relative;
  z-index: 99;
  color: var(--scalar-color-1);
}
.card-form-input + .card-form-input {
  border-left: 1px solid var(--scalar-border-color);
}
.card-form-input input:not(:placeholder-shown) + label {
  color: var(--scalar-color-2);
}

.password-mask {
  padding: 6px 8px 6px 0;
  height: 24px;
  width: auto;
  align-self: center;
}
</style>
