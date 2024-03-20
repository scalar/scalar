<script setup lang="ts">
import { useRequestStore } from '../../stores'
import RequestHistoryItem from './RequestHistoryItem.vue'

defineEmits<{
  (e: 'toggle'): void
}>()

const { requestHistoryOrder } = useRequestStore()
</script>
<template>
  <div class="navigation-content-item">
    <div class="navtable">
      <div class="navtable-table">
        <div class="navtable-item navtable-item__top">
          <div class="navtable-item-40">
            <label for="">Request</label>
          </div>
          <div class="navtable-item-40">
            <label for="">Response</label>
          </div>
          <div class="navtable-item-20">
            <label for="">TIME</label>
          </div>
        </div>
        <div class="navtable-radios">
          <RequestHistoryItem
            v-for="history in requestHistoryOrder"
            :key="history"
            :history="history" />
        </div>
        <div class="navtable-mock">
          <div class="navtable-item">
            <div class="navtable-item-40" />
            <div class="navtable-item-40" />
            <div class="navtable-item-20" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.navtable-mock {
  background-repeat: repeat;
  width: 100%;
  background-size: 31px 31px;
  background-position: center 1px;
  flex: 1;
  position: relative;
  z-index: 0;
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  background: repeating-linear-gradient(
    var(--theme-background-1, var(--default-theme-background-1)),
    var(--theme-background-1, var(--default-theme-background-1)) 34.8px,
    var(--theme-border-color, var(--default-theme-border-color)) 34.8px,
    var(--theme-border-color, var(--default-theme-border-color)) 35.8px
  );
}
.navtable-mock .navtable-item {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background: transparent;
  box-shadow: none;
}

.radio {
  height: 10px;
  max-width: 10px;
  width: 10px;
  max-height: 10px;
  background: transparent;
  border: var(--border, var(--default-border));
  flex-shrink: 0;
  margin-right: 6px;
  margin-left: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  padding: 0;
}
.radio:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.navtable-item__active:before {
  content: '';
  display: block;
  box-shadow: 0 0 0 1px var(--theme-color-1, var(--default-theme-color-1)) !important;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
}
.navtable-item__active + .navtable-item {
  /* box-shadow: none; */
}
.radio.post {
  background: var(--theme-color-green, var(--default-theme-color-green));
}
.radio.delete {
  background: var(--theme-color-red, var(--default-theme-color-red));
}
.radio.patch {
  background: var(--theme-color-yellow, var(--default-theme-color-yellow));
}
.radio.get {
  background: var(--theme-color-blue, var(--default-theme-color-blue));
}
.radio.put {
  background: var(--theme-color-orange, var(--default-theme-color-orange));
}
.navtable-item-request span {
  border: none;
  outline: none;
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-color-1, var(--default-theme-color-1));
  width: 100%;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.navtable-item-request span em {
  text-transform: uppercase;
  font-style: normal;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-size: var(--theme-micro, var(--default-theme-micro));
  margin-right: 6px;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-3, var(--default-theme-color-3));
}
</style>
../../stores/useRequestStore
