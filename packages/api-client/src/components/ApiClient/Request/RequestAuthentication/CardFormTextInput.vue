<script setup lang="ts">
defineProps<{
  id: string
  type?: string
}>()

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
      spellcheck="false"
      :type="type ?? 'text'" />
  </div>
</template>
<style scoped>
:where(.card-form-input) {
  background: transparent;
  position: relative;
  width: 100%;
  text-align: left;
  display: flex;
  border-style: solid;
  border-width: 1px;
  border-color: inherit;
}
.card-form-input:focus-within {
  border-color: var(--scalar-color-3);
}

.card-form-input label,
.card-form-input input {
  padding: 9px;
  border: 0;
  outline: none;
  font-size: var(--scalar-micro);
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
  padding-right: 0;
  white-space: nowrap;
  cursor: text;
}
.card-form-input input {
  position: relative;
  z-index: 99;
}
.card-form-input input:not(:placeholder-shown) + label {
  color: var(--scalar-color-2);
}
</style>
