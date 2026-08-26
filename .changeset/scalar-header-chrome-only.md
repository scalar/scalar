---
'@scalar/components': minor
---

**Breaking:** `ScalarHeader` no longer lays out its own columns. The `start` and `end` slots have been removed in favour of composing `ScalarHeaderColumn` children in the default slot, and a new `is` prop lets the header render as something other than a `header` element.

Columns hug their content. Give the content-bearing column `flex-1` so it takes the free space — that is also the column that absorbs the shrinking when space runs out.

```diff
  <ScalarHeader>
-   <template #start>
-     <ScalarMenu />
-   </template>
-   <template #end>
-     <ScalarHeaderButton cta>Register</ScalarHeaderButton>
-   </template>
+   <ScalarHeaderColumn class="flex-1">
+     <ScalarMenu />
+   </ScalarHeaderColumn>
+   <ScalarHeaderColumn class="justify-end">
+     <ScalarHeaderButton cta>Register</ScalarHeaderButton>
+   </ScalarHeaderColumn>
  </ScalarHeader>
```

**Put `flex-1` on both side columns only when there is a genuine `justify-center` middle column.** In a two-column header it splits the width 50/50 instead, which clips the content-bearing side on narrow screens:

```html
<ScalarHeader>
  <ScalarHeaderColumn class="flex-1">…</ScalarHeaderColumn>
  <ScalarHeaderColumn class="justify-center">…</ScalarHeaderColumn>
  <ScalarHeaderColumn class="flex-1 justify-end">…</ScalarHeaderColumn>
</ScalarHeader>
```

Passing the old slots logs a deprecation warning, and typed consumers get a `vue-tsc` error. One case cannot be detected: a header that used *only* the middle slot now renders its contents left-aligned rather than centred, because that content is indistinguishable from the new default slot. Wrap it as above.

`is` is worth reaching for when a header is nested inside an existing `header` landmark — `is="div"` avoids exposing a second `banner` role.

`ScalarMenu`'s default logo now renders at a fixed size. It previously inherited `ScalarIcon`'s `size: 'full'`, and because the Scalar logo ships a `viewBox` with no intrinsic dimensions, that percentage width resolved against the available space in WebKit — stretching the logo box to fill the header and leaving the mark floating in the middle of it.

This also fixes the app header overflowing narrow viewports, including on iOS Safari. `ScalarHeaderColumn` carries `min-w-0`, so a `flex-1` column shrinks and its long title ellipsizes instead of pushing the header past the screen. Hug columns still size to their content, so keep a trailing action cluster narrow enough to fit on its own.
