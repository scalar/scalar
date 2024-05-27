<template>
  <div class="card-form-rows">
    <slot />
  </div>
</template>
<style scoped>
:where(.card-form-rows) {
  display: flex;
  flex-direction: column;
}
</style>
<style>
:where(.card-form-rows) > * + * {
  border-top: 1px solid var(--scalar-border-color);
}
</style>
