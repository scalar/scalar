<script setup lang="ts">
defineProps<{ items: any[] }>()
</script>

<template>
  <div class="navtable simpletable">
    <div class="navtable-table">
      <div class="navtable-item navtable-item__top">
        <div class="navtable-item-33">
          <label for="">Name</label>
        </div>
        <div class="navtable-item-66">
          <label for="">Value</label>
        </div>
      </div>
      <div
        v-for="item in items"
        :key="item.id"
        class="navtable-item">
        <div class="navtable-item-33">
          <p>
            {{ item.name }}
          </p>
        </div>
        <div class="navtable-item-66">
          <p>
            {{ item.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.simpletable.navtable {
  padding: 0;
}
.simpletable.navtable .navtable-item-66,
.simpletable.navtable .navtable-item-33 {
  display: block;
}
.simpletable.navtable .navtable-table {
  height: fit-content;
}
</style>
