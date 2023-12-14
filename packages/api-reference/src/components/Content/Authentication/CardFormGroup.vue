<template>
  <div class="card-form-group">
    <slot />
  </div>
</template>
<style scoped>
:where(.card-form-group) {
  display: flex;
  border-color: inherit;
}
.card-form-group > * {
  border-color: inherit;
}
.card-form-group > :first-child {
  border-top-left-radius: inherit;
  border-bottom-left-radius: inherit;
}
.card-form-group > :last-child {
  border-top-right-radius: inherit;
  border-bottom-right-radius: inherit;
}
.card-form-group > :deep(* + *) {
  margin-left: -1px;
  border-left-color: transparent;
}
</style>
