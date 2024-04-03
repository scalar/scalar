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
.navtable {
  width: 100%;
}
.navtable-follow {
  background-color: black;
  color: white;
  font-size: 9px;
  padding: 6px;
  display: -webkit-box;
  max-width: 250px;
  -webkit-line-clamp: 12;
  border-radius: 3px;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.24;
  transform: translate3d(10px, 0, 0);
}
.navtable-follow:after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 6px;
  background-color: black;
}
.navtable-follow * {
  font-family: var(--scalar-font-code) !important;
}
.navtable-table {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 389px;
  border-radius: var(--scalar-radius);
  border: 1px solid var(--scalar-border-color);
}
.navtable-radios {
  z-index: 1;
  border-top: 1px solid var(--scalar-border-color);
}
.navtable-item {
  display: flex;
  position: relative;
  color: var(--scalar-color-1);
  font-size: var(--scalar-micro);
  border-top: 1px solid var(--scalar-border-color);
  font-weight: var(--scalar-semibold);
}
.navtable-item:first-of-type {
  border-top: none;
}
.navtable-item > div {
  word-wrap: break-word;
}
.navtable-item > div:not(:first-child) {
  border-left: 1px solid var(--scalar-border-color);
}
.navtable-item-action {
  color: var(--scalar-color-2);
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-bold);
  background: var(--scalar-api-client-bg3);
  border: none;
  border-radius: 30px;
  appearance: none;
  max-height: 25px;
  margin-left: 12px;
  margin-right: 6px;
  padding: 4px 8px;
  outline: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
  white-space: nowrap;
  position: relative;
}
.navtable-item-action:hover {
  color: var(--scalar-color-1);
  background: var(--scalar-api-client-gradient);
  box-shadow: 0 0 0 1px var(--scalar-border-color);
}
.navtable-item-action:focus {
  background: var(--scalar-background-2);
}
.navtable-item:hover,
.navtable-item:focus-within .navtable-item-action {
  opacity: 1;
}
.navtable-item-add {
  display: flex;
  align-items: center;
  padding: 9px;
  font-weight: var(--scalar-bold);
  outline: none;
  border: none;
  appearance: none;
  background: transparent;
  color: var(--scalar-color-1);
}
.navtable-item-add:hover {
  background: var(--scalar-background-2);
  cursor: pointer;
}
.navtable-item-25 {
  width: 25%;
  font-size: var(--scalar-micro);
  display: flex;
  align-items: center;
}
.navtable-item-33 {
  width: 33.33333%;
  display: flex;
  font-size: var(--scalar-micro);
  align-items: center;
}
.navtable-item-66 {
  width: 66.6666%;
  display: flex;
  font-size: var(--scalar-micro);
  align-items: center;
}
.navtable-item-75 {
  width: 75%;
  display: flex;
  align-items: center;
}
.navtable-item-75:focus-within {
  background: var(--scalar-background-2);
}
.navtable-item-40 {
  width: 40%;
  display: flex;
  align-items: center;
  padding: 9px;
}
.navtable-item-20 {
  width: 20%;
  display: flex;
  align-items: center;
  padding: 9px;
}
.navtable-item-50 {
  width: 50%;
  display: flex;
  align-items: center;
}
.navtable-item-50:focus-within {
  background: var(--scalar-background-2);
}
.navtable-item p {
  padding: 9px;
}
.navtable-item input {
  padding: 12px 6px;
  border: none;
  outline: none;
  appearance: none;
  font-size: var(--scalar-micro);
  color: var(--scalar-color-1);
  background: transparent;
  width: 100%;
}
.navtable-item input:focus {
  background: var(--scalar-background-2);
}
.navtable-item-select {
  position: relative;
}
.navtable-item-select select {
  background: transparent;
  outline: none;
  border: none;
  font-size: var(--scalar-micro);
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  padding: 12px 6px;
  top: 0;
  position: relative;
  cursor: pointer;
  color: var(--scalar-color-2);
}
.navtable-item-select svg {
  position: absolute;
  right: 6px;
  color: var(--scalar-color-ghost);
  width: 6px;
  top: 12px;
  pointer-events: none;
}
.navtable-item .option {
  padding: 12px 6px;
  font-size: var(--scalar-micro);
  color: var(--scalar-color-1);
  width: 100%;
}
.navtable-item label {
  color: var(--scalar-color-3);
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-semibold);
  text-transform: uppercase;
  display: block;
  width: 100%;
}
.navtable-item-response {
  padding: 0 9px;
}
.navtable-item-response span {
  font-size: var(--scalar-micro);
  display: flex;
  align-items: center;
  margin-right: 9px;
  min-width: 40px;
}
.navtable-item-response span:empty {
  display: none;
}
.navtable-mock {
  background-repeat: repeat;
  width: 100%;
  background-size: 31px 31px;
  background-position: center 1px;
  flex: 1;
  position: relative;
  z-index: 0;
  border-top: 1px solid var(--scalar-border-color);
  background: repeating-linear-gradient(
    var(--scalar-background-1),
    var(--scalar-background-1) 34.8px,
    var(--scalar-border-color) 34.8px,
    var(--scalar-border-color) 35.8px
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
  border: var(--border);
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
  box-shadow: 0 0 0 1px var(--scalar-color-1) !important;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
}
.radio.post {
  background: var(--scalar-color-green);
}
.radio.delete {
  background: var(--scalar-color-red);
}
.radio.patch {
  background: var(--scalar-color-yellow);
}
.radio.get {
  background: var(--scalar-color-blue);
}
.radio.put {
  background: var(--scalar-color-orange);
}
.navtable-item-request span {
  border: none;
  outline: none;
  font-size: var(--scalar-micro);
  color: var(--scalar-color-1);
  width: 100%;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.navtable-item-request span em {
  text-transform: uppercase;
  font-style: normal;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-micro);
  margin-right: 6px;
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-3);
}
</style>
