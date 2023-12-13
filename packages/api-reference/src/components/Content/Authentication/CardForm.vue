<template>
  <form class="card-form">
    <slot />
  </form>
</template>
<style scoped>
.card-form {
  color: var(--theme-color-1, var(--default-theme-color-1));
  --input-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}
.card-form > :first-child {
  border-top-left-radius: var(--input-radius);
  border-top-right-radius: var(--input-radius);
}
.card-form > :last-child {
  border-bottom-left-radius: var(--input-radius);
  border-bottom-right-radius: var(--input-radius);
}
.card-form.card-form > :deep(* + *) {
  margin-top: -1px;
  border-top-color: transparent;
}
</style>
