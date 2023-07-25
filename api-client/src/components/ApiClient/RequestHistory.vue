<script setup lang="ts">
import { useApiClientRequestStore } from '../../stores/apiClientRequestStore'
import RequestHistoryItem from './RequestHistoryItem.vue'

defineEmits<{
  (e: 'toggle'): void
}>()

const { requestHistoryOrder } = useApiClientRequestStore()
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
  background-image: linear-gradient(
    0deg,
    var(--scalar-api-client-border-color) 1px,
    --scalar-api-client-background-1 1px
  );
  background-size: 31px 31px;
  background-position: center 1px;
  flex: 1;
  position: relative;
}
.navtable-mock .navtable-item {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background: transparent;
  border-top: none;
}

.radio {
  height: 16px;
  width: 16px;
  background: transparent;
  border: var(--border);
  flex-shrink: 0;
  margin-right: 6px;
  margin-left: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
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
.navtable-item__active .radio:after {
  content: '';
  width: 5px;
  height: 8px;
  border: solid white;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg) translate3d(-0.5px, -1px, 0);
}
.radio.post {
  background: var(--scalar-api-client-post-color);
}
.radio.delete {
  background: var(--scalar-api-client-delete-color);
}
.radio.patch {
  background: var(--scalar-api-client-patch-color);
}
.radio.get {
  background: var(--scalar-api-client-get-color);
}
.radio.put {
  background: var(--scalar-api-client-put-color);
}
</style>
