<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ items: any[] }>()

const showDescription = ref(false)
</script>
<template>
  <div class="table">
    <div class="table-row">
      <div class="table-row-item">
        <label>Key</label>
      </div>
      <div class="table-row-item">
        <label>Value</label>
      </div>
      <div
        v-show="showDescription"
        class="table-row-item">
        <label>Description</label>
      </div>
      <div
        class="table-row-meta"
        @click="showDescription = !showDescription">
        <svg
          fill="currentColor"
          height="12"
          viewBox="0 0 18 12"
          width="18"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 12h12v-2H0v2zM0 0v2h18V0H0zm0 7h18V5H0v2z"
            fill-rule="nonzero" />
        </svg>
      </div>
    </div>
    <div
      v-for="item in items"
      :key="item.id"
      class="table-row"
      :class="item.customClass">
      <div class="table-row-item">
        <input
          disabled
          :value="item.name" />
        <!-- <MultilineEditor
          :elID="`key_${item}`"
          :focus="newlyAdded === `key_${item}` ? true : false"
          :placeholder="''"
          :singleLineEditor="true"
          :value="dataObject[item].key"
          @update="value => $emit('updateKey', item, value)" /> -->
        <!-- <input :value="dataObject[item].key" @input="$emit('updateKey', item, $event.target.value)" type="text"> -->
      </div>
      <div class="table-row-item">
        <input
          v-model="item.value"
          placeholder="value" />
        <!-- <MultilineEditor
          :elID="`value_${item}`"
          :focus="newlyAdded === `value_${item}` ? true : false"
          :placeholder="''"
          :singleLineEditor="true"
          :value="dataObject[item].value"
          @update="value => $emit('updateValue', item, value)" /> -->
        <!-- <input :ref="`value_${item}`" :value="dataObject[item].value" @input="$emit('updateValue', item, $event.target.value)" type="text"> -->
        <div class="table-row-item-menu">
          <svg
            height="16"
            viewBox="0 0 4 16"
            width="4"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2C.9 6 0 6.9 0 8s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
              fill-rule="nonzero" />
          </svg>
        </div>
      </div>
      <div
        v-show="showDescription"
        class="table-row-item">
        <!-- <input
          :ref="`description_${item}`"
          type="text"
          :value="dataObject[item].description"
          @input="$emit('updateDescription', item, $event.target.value)"> -->
      </div>
      <div class="table-row-meta">
        <label class="meta-check">
          <input type="checkbox" />
          <span class="meta-checkmark" />
        </label>
        <!-- @click="$emit('deleteItem', item)">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"  -->
      </div>
    </div>
  </div>
</template>
<style>
.table {
  border: var(--scalar-api-client-border);
  background: transparent;
  border-radius: var(--scalar-api-client-rounded);
  width: 100%;
}
.table-row {
  border-bottom: var(--scalar-api-client-border);
  display: flex;
  position: relative;
}
.table-row__add {
  border-radius: 0 0 var(--scalar-api-client-rounded)
    var(--scalar-api-client-rounded);
  border-bottom: none;
}
.table-row.required-parameter .table-row-item:nth-of-type(2):after {
  content: 'Required';
  position: absolute;
  top: 4px;
  right: 0;
  padding: 5px 9px 5px 6px;
  font-weight: var(--scalar-api-client-font-semibold);
  font-size: 12px;
  background: var(--scalar-api-client-background-secondary);
  box-shadow: -2px 0 4px var(--scalar-api-client-background-secondary);
}
.table-row.required-parameter
  .table-row-item:nth-of-type(2):focus-within:after {
  display: none;
}
.table-row:last-of-type {
  border-bottom: none;
}
.table-row__active {
  border-radius: 0 0 var(--scalar-api-client-rounded)
    var(--scalar-api-client-rounded);
}
.table-row-drag {
  width: 20px;
  flex-shrink: 0;
  border-right: var(--scalar-api-client-border);
  align-items: center;
  justify-content: center;
  display: none;
}
.table-row-drag svg {
  width: 6px;
  fill: var(--scalar-api-client-color-3);
}
.table-row-drag .table-row-drag-add {
  width: 8px;
}
.table-row-item {
  width: 100%;
  border-right: var(--scalar-api-client-border);
  position: relative;
}
.table-row-item-menu {
  position: absolute;
  right: 12px;
  background: var(--scalar-api-client-background-3);
  border: var(--scalar-api-client-border);
  width: 24px;
  height: 24px;
  top: 50%;
  transform: translate3d(0, -50%, 0);
  border-radius: var(--scalar-api-client-rounded);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  cursor: pointer;
}
.table-row-item input:focus + .table-row-item-menu,
.table-row-item:hover .table-row-item-menu {
  opacity: 1;
}
.table-row-item-menu svg {
  height: 12px;
  width: initial;
  fill: var(--scalar-api-client-color-3);
}
.table-row-item input {
  border: none;
  appearance: none;
  outline: none;
  padding: 9px;
  width: 100%;
  background: var(--scalar-api-client-background-input);
  color: var(--scalar-api-client-theme-color-1);
  font-size: 12px;
}
.table-row-item input[disabled] {
  background: transparent;
  font-family: var(--scalar-api-client-font-mono);
}
.table-row-item input:focus {
  background: var(--scalar-api-client-background-secondary);
}
.table-row-item label {
  background: transparent;
  text-transform: uppercase;
  display: block;
  padding: 9px;
  font-weight: var(--scalar-api-client-font-bold);
  color: var(--scalar-api-client-color-3);
  font-size: 12px;
}
.table-row-meta {
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  user-select: none;
}
.table-row-meta-check {
  width: 18px;
  height: 18px;
  border-radius: var(--scalar-api-client-rounded);
  background: rgba(47, 177, 228, 0.1);
}
.table-row-meta svg {
  width: 13px;
  height: 13px;
  margin: 0 1px;
  color: var(--scalar-api-client-color-3);
  cursor: pointer;
}
.table-row-meta svg:hover {
  color: var(--scalar-api-client-theme-color-2);
}
.meta-check {
  display: flex;
  position: relative;
  cursor: pointer;
  align-items: center;
  font-size: 12px;
  border-radius: var(--scalar-api-client-rounded);
  user-select: none;
  margin: 0 1px;
  transition: all 0.15s ease-in-out;
}
.meta-check input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.meta-checkmark {
  height: 15px;
  width: 15px;
  background: var(--scalar-api-client-background-input);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.meta-check .meta-checkmark:after {
  content: '';
  display: none;
  width: 5px;
  height: 8px;
  border: solid var(--scalar-api-client-theme-color-1);
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg) translate3d(0, -1px, 0);
}
.meta-check input:checked ~ .meta-checkmark:after {
  display: block;
}
</style>
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
  font-family: var(--scalar-api-client-font-mono) !important;
}
.navtable-table {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 381px;
}
.navtable-item {
  display: flex;
  position: relative;
  color: var(--scalar-api-client-theme-color-1);
  border-top: var(--scalar-api-client-border);
  font-weight: var(--scalar-api-client-font-semibold);
}
.navtable-item > div {
  word-wrap: break-word;
}
.navtable-item > div:not(:first-child) {
  border-left: var(--scalar-api-client-border);
}
.navtable-item-action {
  color: var(--scalar-api-client-theme-color-2);
  font-size: 12px;
  font-weight: var(--scalar-api-client-font-bold);
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
  color: var(--scalar-api-client-theme-color-1);
  background: var(--scalar-api-client-gradient);
  box-shadow: 0 0 0 1px var(--scalar-api-client-border-color);
}
.navtable-item-action:focus {
  background: var(--scalar-api-client-background-secondary);
}
.navtable-item:hover,
.navtable-item:focus-within .navtable-item-action {
  opacity: 1;
}
.navtable-item-add {
  display: flex;
  align-items: center;
  padding: 9px;
  font-weight: var(--scalar-api-client-font-bold);
  outline: none;
  border: none;
  appearance: none;
  background: transparent;
  color: var(--scalar-api-client-theme-color-1);
}
.navtable-item-add:hover {
  background: var(--scalar-api-client-background-secondary);
  cursor: pointer;
}
.navtable-item-25 {
  width: 25%;
  font-size: 12px;
  display: flex;
  align-items: center;
}
.navtable-item-33 {
  width: 33.33333%;
  display: flex;
  font-size: 12px;
  align-items: center;
}
.navtable-item-66 {
  width: 66.6666%;
  display: flex;
  font-size: 12px;
  align-items: center;
}
.navtable-item-75 {
  width: 75%;
  display: flex;
  align-items: center;
}
.navtable-item-75:focus-within {
  background: var(--scalar-api-client-background-secondary);
}
.navtable-item-40 {
  width: 40%;
  display: flex;
  align-items: center;
}
.navtable-item-20 {
  width: 20%;
  display: flex;
  align-items: center;
}
.navtable-item-50 {
  width: 50%;
  display: flex;
  align-items: center;
}
.navtable-item-50:focus-within {
  background: var(--scalar-api-client-background-secondary);
}
.navtable-item p {
  padding: 9px;
}
.navtable-item input {
  padding: 12px 6px;
  border: none;
  outline: none;
  appearance: none;
  font-size: 12px;
  color: var(--scalar-api-client-theme-color-1);
  background: transparent;
  width: 100%;
}
.navtable-item input:focus {
  background: var(--scalar-api-client-background-secondary);
}
.navtable-item-select {
  position: relative;
}
.navtable-item-select select {
  background: transparent;
  outline: none;
  border: none;
  font-size: 12px;
  appearance: none;
  width: 100%;
  padding: 12px 6px;
  top: 0;
  position: relative;
  cursor: pointer;
  color: var(--scalar-api-client-theme-color-2);
}
.navtable-item-select svg {
  position: absolute;
  right: 6px;
  color: var(--scalar-api-client-fill);
  width: 6px;
  top: 12px;
  pointer-events: none;
}
.navtable-item .option {
  padding: 12px 6px;
  font-size: 12px;
  color: var(--scalar-api-client-theme-color-1);
  width: 100%;
}
.navtable-item label {
  color: var(--scalar-api-client-color-3);
  font-size: 12px;
  font-weight: var(--scalar-api-client-font-bold);
  text-transform: uppercase;
  padding: 9px;
  display: block;
  width: 100%;
}
.navtable-item-response {
  padding: 0 9px;
}
.navtable-item-response span {
  font-size: 12px;
  display: flex;
  align-items: center;
  margin-right: 6px;
  min-width: 50px;
}
.scalar-api-client__status--1xx:before,
.scalar-api-client__status--2xx:before,
.scalar-api-client__status--3xx:before,
.scalar-api-client__status--4xx:before,
.scalar-api-client__status--5xx:before,
.scalar-api-client__status--6xx:before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 4px;
  background: var(--scalar-api-client-background-secondary);
}
.scalar-api-client__status--2xx:before {
  background: green;
}
.scalar-api-client__status--3xx:before {
  background: orange;
}
.scalar-api-client__status--4xx:before {
  background: red;
}
.navtable-item-response span:empty {
  display: none;
}
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
