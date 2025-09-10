<script setup lang="ts">
import { htmlFromMarkdown } from '@scalar/code-highlight'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed, useTemplateRef } from 'vue'

import type { ScalarMarkdownProps } from './types'

const {
  value,
  transform,
  transformType,
  withImages = false,
  withAnchors = false,
  anchorPrefix,
} = defineProps<ScalarMarkdownProps>()

const { cx } = useBindCx()
defineOptions({ inheritAttrs: false })

// Expose the element ref to the parent component
const templateRef = useTemplateRef('div')
defineExpose({ el: templateRef })

const transformHeading = (node: Record<string, any>) => {
  if (!withAnchors) {
    return transform?.(node) || node
  }

  const headingText = node.children?.[0]?.value || ''

  /** Basic slugify for the heading text */
  const slug = headingText.toLowerCase().replace(/\s+/g, '-')

  /** Return adding anchor prefix if present or just the slug */
  const id = anchorPrefix ? `${anchorPrefix}/description/${slug}` : slug

  // Add the id to the heading
  node.data = {
    hProperties: {
      id,
    },
  }

  if (transform) {
    return transform(node)
  }

  return node
}

const html = computed(() => {
  return htmlFromMarkdown(value ?? '', {
    removeTags: withImages ? [] : ['img', 'picture'],
    transform:
      withAnchors && transformType === 'heading' ? transformHeading : transform,
    transformType,
  })
})
</script>
<template>
  <div
    ref="div"
    v-bind="cx('markdown', { 'line-clamp-(--markdown-clamp)': !!clamp })"
    :style="{ '--markdown-clamp': clamp }"
    v-html="html" />
</template>
<style>
@import '@scalar/code-highlight/css/code.css';

.scalar-app {
  /* Base container and variables */
  .markdown {
    --scalar-refs-heading-spacing: 24px;
    --markdown-border: var(--scalar-border-width) solid
      var(--scalar-border-color);
    --markdown-spacing-sm: 12px;
    --markdown-spacing-md: 16px;
    --markdown-line-height: 1.625;

    font-family: var(--scalar-font);
    word-break: break-word;
  }

  .markdown > * {
    margin-bottom: var(--markdown-spacing-md);
  }

  /* margin gets doubled between heading + non heading elements if we don't do this*/
  .markdown > *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):last-child {
    margin-bottom: 0;
  }
  /* Headings (h1-h6) */
  .markdown h1 {
    --font-size: 1.5rem;
    --markdown-line-height: 32px;
  }

  .markdown h2,
  .markdown h3 {
    --font-size: 1.25rem;
    --markdown-line-height: 1.3;
  }

  .markdown h4,
  .markdown h5,
  .markdown h6 {
    --font-size: 1rem;
  }

  .markdown h1,
  .markdown h2,
  .markdown h3,
  .markdown h4,
  .markdown h5,
  .markdown h6 {
    display: block;
    font-size: var(--font-size);
    font-weight: var(--scalar-bold);
    margin-top: var(--scalar-refs-heading-spacing);
    margin-bottom: var(--markdown-spacing-sm);
    scroll-margin-top: 1rem;
  }

  /* Text formatting and paragraphs */
  .markdown b,
  .markdown strong {
    font-weight: var(--scalar-bold);
  }

  .markdown p {
    color: inherit;
    display: block;
    line-height: var(--markdown-line-height);
  }

  /* Images */
  .markdown img {
    /**
    * With `display: block` <a><img></a> will take the whole width.
    *
    * @see https://github.com/scalar/scalar/issues/3961
    */
    display: inline-block;
    overflow: hidden;
    border-radius: var(--scalar-radius);
    max-width: 100%;
  }

  /* Lists */
  .markdown ul:not(.contains-task-list),
  .markdown ol {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .markdown ul:not(.contains-task-list) {
    margin-left: 29px;
  }

  .markdown ul:not(.contains-task-list) li {
    padding-left: calc(var(--markdown-spacing-md) / 2);
  }

  .markdown ul {
    list-style-type: disc;
  }

  .markdown li {
    line-height: var(--markdown-line-height);
  }

  .markdown ul li {
    padding-left: var(--markdown-spacing-md);
  }

  .markdown ol {
    counter-reset: item;
    padding-left: 5px;
  }

  .markdown ol li {
    display: flex;
    gap: 5px;
    padding-left: 3px;
  }

  .markdown ol li::before {
    content: counter(item) '\002E';
    counter-increment: item;
    display: flex;
    font: var(--scalar-font);
    font-variant-numeric: tabular-nums;
    font-weight: var(--scalar-semibold);
    justify-content: center;
    line-height: var(--markdown-line-height);
    width: 24px;
    white-space: nowrap;
  }

  .markdown ol li::before,
  .markdown ol ol ol li::before,
  .markdown ol ol ol ol ol ol li::before {
    content: counter(item, decimal) '\002E';
  }

  .markdown ol ol li::before,
  .markdown ol ol ol ol li::before,
  .markdown ol ol ol ol ol ol ol li::before {
    content: counter(item, lower-alpha) '\002E';
  }

  .markdown ol ol li::before,
  .markdown ol ol ol ol ol li::before,
  .markdown ol ol ol ol ol ol ol ol li::before {
    content: counter(item, lower-roman) '\002E';
  }

  .markdown ul:first-of-type li:first-of-type {
    margin-top: 0;
  }

  /* Tables */
  .markdown table {
    display: table;
    table-layout: fixed;
    overflow-x: auto;
    position: relative;
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    box-shadow: 0 0 0 var(--scalar-border-width) var(--scalar-border-color);
    border-radius: var(--scalar-radius);
  }

  .markdown tbody,
  .markdown thead {
    vertical-align: middle;
  }

  .markdown tbody {
    display: table-row-group;
  }

  .markdown thead {
    display: table-header-group;
  }

  .markdown tr {
    display: table-row;
    border-color: inherit;
    vertical-align: inherit;
  }

  .markdown td,
  .markdown th {
    display: table-cell;
    vertical-align: top;
    min-width: 1em;
    padding: 8.5px 16px;
    line-height: var(--markdown-line-height);
    position: relative;
    word-break: initial;
    font-size: var(--scalar-small);
    color: var(--scalar-color-1);
    border-right: var(--markdown-border);
    border-bottom: var(--markdown-border);
  }

  .markdown td > *,
  .markdown th > * {
    margin-bottom: 0;
  }

  .markdown th:empty {
    display: none;
  }

  .markdown td:first-of-type,
  .markdown th:first-of-type {
    border-left: none;
  }

  .markdown td:last-of-type,
  .markdown th:last-of-type {
    border-right: none;
  }

  .markdown tr:last-of-type td {
    border-bottom: none;
  }

  .markdown th {
    font-weight: var(--scalar-bold);
    text-align: left;
    border-left-color: transparent;
    background: var(--scalar-background-2);
  }

  .markdown th:first-of-type {
    border-top-left-radius: var(--scalar-radius);
  }

  .markdown th:last-of-type {
    border-top-right-radius: var(--scalar-radius);
  }

  .markdown tr > [align='left'] {
    text-align: left;
  }

  .markdown tr > [align='right'] {
    text-align: right;
  }

  .markdown tr > [align='center'] {
    text-align: center;
  }

  /* Details */
  .markdown details {
    border: var(--markdown-border);
    border-radius: var(--scalar-radius);
    color: var(--scalar-color-1);
  }

  .markdown details > :not(summary) {
    margin: var(--markdown-spacing-md);
    margin-bottom: 0;
  }

  .markdown details > p:has(> strong):not(:has(:not(strong))) {
    margin-bottom: 8px;
  }

  .markdown details > p:has(> strong):not(:has(:not(strong))) + * {
    margin-top: 0;
  }

  .markdown details > table {
    width: calc(100% - calc(var(--markdown-spacing-md) * 2));
  }

  .markdown summary {
    border-radius: 2.5px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-height: 40px;
    padding: 7px 14px;
    position: relative;
    font-weight: var(--scalar-semibold);
    line-height: var(--markdown-line-height);
    cursor: pointer;
    user-select: none;
  }

  .markdown summary:hover {
    background-color: var(--scalar-background-2);
  }

  .markdown details[open] {
    padding-bottom: var(--markdown-spacing-md);
  }

  .markdown details[open] > summary {
    border-bottom: var(--markdown-border);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .markdown summary::before {
    display: block;
    content: '';
    flex-shrink: 0;
    width: var(--markdown-spacing-md);
    height: var(--markdown-spacing-md);
    background-color: var(--scalar-color-3);
    mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" width="1em" height="1em"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>');
    margin-top: 5px;
  }

  .markdown summary:hover::before {
    background-color: var(--scalar-color-1);
  }

  .markdown details[open] > summary::before {
    transform: rotate(90deg);
    transition: transform 0.1s ease-in-out;
  }

  .markdown details:has(+ details) {
    border-bottom: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    margin-bottom: 0;
  }

  .markdown details:has(+ details) + details,
  .markdown details:has(+ details) + details > summary {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  /* Links */
  .markdown a {
    --font-color: var(--scalar-link-color, var(--scalar-color-accent));
    --font-visited: var(--scalar-link-color-visited, var(--scalar-color-2));
    text-decoration: var(--scalar-text-decoration);

    color: var(--font-color);
    font-weight: var(--scalar-link-font-weight, var(--scalar-semibold));
    text-underline-offset: 0.25rem;
    text-decoration-thickness: 1px;
    text-decoration-color: color-mix(
      in srgb,
      var(--font-color) 30%,
      transparent
    );
  }

  .markdown a:hover {
    text-decoration-color: var(currentColor, var(--scalar-color-1));
    color: var(--scalar-link-color-hover, var(--scalar-color-accent));
    -webkit-text-decoration: var(--scalar-text-decoration-hover);
    text-decoration: var(--scalar-text-decoration-hover);
  }

  .markdown a:visited {
    color: var(--font-visited);
  }

  /* Text effects and formatting */
  .markdown em {
    font-style: italic;
  }

  .markdown sup,
  .markdown sub {
    font-size: var(--scalar-micro);
    font-weight: 450;
  }

  .markdown sup {
    vertical-align: super;
  }

  .markdown sub {
    vertical-align: sub;
  }

  .markdown del {
    text-decoration: line-through;
  }

  /* Code blocks and inline code */
  .markdown code {
    font-family: var(--scalar-font-code);
    background-color: var(--scalar-background-2);
    box-shadow: 0 0 0 var(--scalar-border-width) var(--scalar-border-color);
    font-size: var(--scalar-micro);
    border-radius: 2px;
    padding: 0 3px;
  }

  .markdown .hljs {
    font-size: var(--scalar-small);
  }

  .markdown pre code {
    display: block;
    white-space: pre;
    padding: var(--markdown-spacing-sm);
    line-height: 1.5;
    margin: var(--markdown-spacing-sm) 0;
    -webkit-overflow-scrolling: touch;
    overflow-x: auto;
    max-width: 100%;
    min-width: 100px;
  }

  /* Horizontal rules */
  .markdown hr {
    border: none;
    border-bottom: var(--markdown-border);
  }

  /* Blockquotes */
  .markdown blockquote {
    border-left: 1px solid var(--scalar-color-1);
    padding-left: var(--markdown-spacing-md);
    margin: 0;
    display: block;
    font-weight: var(--scalar-bold);
    font-size: var(--scalar-font-size-2);
  }

  /* Markdown Checklist */
  .markdown .contains-task-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    list-style: none;
  }

  .markdown .contains-task-list li {
    align-items: center;
    display: flex;
    gap: 10.5px;
    padding-left: 10.5px;
  }

  .markdown .contains-task-list input {
    position: relative;
    appearance: none;
    -webkit-appearance: none;
    display: flex;
    width: var(--markdown-spacing-md);
    height: var(--markdown-spacing-md);
    align-content: center;
    justify-content: center;
    border: 1px solid var(--scalar-color-3);
    border-radius: var(--scalar-radius);
  }

  .markdown .contains-task-list input:checked {
    background-color: var(--scalar-color-1);
    border-color: var(--scalar-color-1);
  }

  .markdown .contains-task-list input[type='checkbox']::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 1px;
    width: 5px;
    height: 10px;
    border: solid var(--scalar-background-1);
    border-width: 0 1.5px 1.5px 0;
    transform: rotate(45deg);
    opacity: 0;
  }

  .markdown .contains-task-list input[type='checkbox']:checked::before {
    opacity: 1;
  }

  /* Markdown Alert */
  .markdown .markdown-alert {
    align-items: stretch;
    border-radius: var(--scalar-radius);
    background-color: color-mix(
      in srgb,
      var(--scalar-background-2),
      transparent
    );
    border: var(--markdown-border);
    display: flex;
    gap: var(--markdown-spacing-sm);
    padding: 10px 14px;
    position: relative;
  }

  .markdown .markdown-alert .markdown-alert-icon::before {
    content: '';
    display: block;
    width: 18px;
    height: 18px;
    background-color: currentColor;
    flex-shrink: 0;
    margin-top: 3px;
    mask-repeat: no-repeat;
    mask-size: contain;
    mask-position: center;
  }

  .markdown .markdown-alert.markdown-alert-note {
    background-color: color-mix(
      in srgb,
      var(--scalar-color-blue),
      transparent 97%
    );
    border: var(--scalar-border-width) solid
      color-mix(in srgb, var(--scalar-color-blue), transparent 50%);
  }

  .markdown .markdown-alert.markdown-alert-tip {
    background-color: color-mix(
      in srgb,
      var(--scalar-color-2),
      transparent 97%
    );
    border: var(--scalar-border-width) solid
      color-mix(in srgb, var(--scalar-color-2), transparent 50%);
  }

  .markdown .markdown-alert.markdown-alert-note .markdown-alert-icon::before,
  .markdown .markdown-alert.markdown-alert-tip .markdown-alert-icon::before {
    mask-image: url('data:image/svg+xml,<svg data-v-852d534d="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" class="icon-placeholder"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path></svg>');
    color: var(--scalar-color-blue);
  }

  .markdown .markdown-alert.markdown-alert-important,
  .markdown .markdown-alert.markdown-alert-warning {
    background-color: color-mix(
      in srgb,
      var(--scalar-color-orange),
      transparent 97%
    );
    border: var(--scalar-border-width) solid
      color-mix(in srgb, var(--scalar-color-orange), transparent 50%);
  }

  .markdown
    .markdown-alert.markdown-alert-important
    .markdown-alert-icon::before,
  .markdown
    .markdown-alert.markdown-alert-warning
    .markdown-alert-icon::before {
    mask-image: url('data:image/svg+xml,<svg data-v-852d534d="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" class="icon-placeholder"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"></path></svg>');
  }

  .markdown .markdown-alert.markdown-alert-caution {
    background-color: color-mix(
      in srgb,
      var(--scalar-color-red),
      transparent 97%
    );
    border: var(--scalar-border-width) solid
      color-mix(in srgb, var(--scalar-color-red), transparent 50%);
  }

  .markdown
    .markdown-alert.markdown-alert-caution
    .markdown-alert-icon::before {
    mask-image: url('data:image/svg+xml,<svg data-v-852d534d="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" class="icon-placeholder"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"></path></svg>');
    color: var(--scalar-color-red);
  }

  .markdown .markdown-alert.markdown-alert-success {
    background-color: color-mix(
      in srgb,
      var(--scalar-color-green),
      transparent 97%
    );
    border: var(--scalar-border-width) solid
      color-mix(in srgb, var(--scalar-color-green), transparent 50%);
  }

  .markdown
    .markdown-alert.markdown-alert-success
    .markdown-alert-icon::before {
    mask-image: url('data:image/svg+xml,<svg data-v-852d534d="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" class="icon-placeholder"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path></svg>');
    color: var(--scalar-color-green);
  }

  .markdown .markdown-alert.markdown-alert-note .markdown-alert-icon::before {
    color: var(--scalar-color-blue);
  }

  .markdown .markdown-alert.markdown-alert-tip .markdown-alert-icon::before {
    color: var(--scalar-color-2);
  }

  .markdown
    .markdown-alert.markdown-alert-important
    .markdown-alert-icon::before {
    color: var(--scalar-color-purple);
  }

  .markdown
    .markdown-alert.markdown-alert-warning
    .markdown-alert-icon::before {
    color: var(--scalar-color-orange);
  }

  .markdown .markdown-alert .markdown-alert-content {
    margin: 0;
    line-height: var(--markdown-line-height);
  }
}
</style>
