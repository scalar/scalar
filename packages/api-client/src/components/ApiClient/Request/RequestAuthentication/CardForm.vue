<template>
  <div class="card-form">
    <slot />
  </div>
</template>
<style scoped>
.card-form {
  --input-radius: var(--scalar-radius-lg);
  border-color: var(--scalar-border-color);
  color: var(--scalar-color-1);
  width: 100%;
}
.card-form > :first-child {
  border-top-left-radius: var(--input-radius);
  border-top-right-radius: var(--input-radius);
}
.card-form > :last-child {
  border-bottom-left-radius: var(--input-radius);
  border-bottom-right-radius: var(--input-radius);
}
.card-form > :deep(* + *) {
  margin-top: -1px;
  border-top-color: transparent;
}
</style>
