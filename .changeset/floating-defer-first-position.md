---
'@scalar/components': patch
---

perf(components): defer ScalarFloating's first positioning to the next tick

`useFloating`'s `autoUpdate` ran `computePosition` inside the mount flush, so every floating element forced a style and layout pass while it was mounting, whether or not it was open. A page that mounts ten closed dropdowns paid ten forced passes before anything appeared.

`whileElementsMounted` now starts `autoUpdate` from `nextTick`, chained on the current flush so it still runs before paint, with a disposed flag so an element unmounted within that tick never starts one. On a large API reference document this takes layout events per interaction from eleven to two, and the layout objects walked from 278,715 to 49,539.

This affects every consumer of `ScalarFloating`, including the dropdown, listbox, popover, combobox, menu and tooltip components. The full component end-to-end suite (203 tests, 219 screenshots) shows no snapshot change, and `ScalarFloating`'s own suite covers all twelve placements, resizing and the constrained max-size case.
