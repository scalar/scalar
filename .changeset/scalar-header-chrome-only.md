---
'@scalar/components': minor
---

**Breaking:** `ScalarHeader` no longer lays out its own columns. The `start`, `center` and `end` slots have been removed in favour of composing `ScalarHeaderColumn` children, and a new `is` prop lets the header render as something other than a `header` element.

Columns hug their content. Give a column `flex-1` to let it take the free space, and give both side columns `flex-1` when the middle one should sit centred.

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

Passing the old slots logs a deprecation warning, and typed consumers get a `vue-tsc` error. One case cannot be detected: a header that used *only* the centre slot now renders its contents left-aligned rather than centred, because that content is indistinguishable from the new default slot. Wrap it in a `ScalarHeaderColumn` with `justify-center` and `flex-1` on the columns either side.

This also fixes the header overflowing narrow viewports, including on iOS Safari. `ScalarHeaderColumn` carries `min-w-0`, so a long title ellipsizes instead of pushing the header past the screen.
