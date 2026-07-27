---
'@scalar/api-client': patch
---

Keep `DataTableCheckbox` visually in sync with its value. The checkbox now mirrors `modelValue` onto the native input whenever the value settles, including when the parent updates it asynchronously, so a successful toggle no longer flickers back before the update lands.
