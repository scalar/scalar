---
'@scalar/api-reference': patch
---

fix(api-reference): account for sticky headers when scrolling to anchors

When a host app has a sticky or fixed navigation bar, deep-linking to a
section anchor was scrolling the heading behind the bar, making it appear
truncated or invisible.

Two helpers are added to `lazy-bus.ts`:

- `getStickyHeaderOffset()` — scans all sticky/fixed elements pinned at
  the top of the viewport and returns the tallest height
- `scrollToElement(el)` — uses `window.scrollTo` with the computed offset
  when a sticky header is present, falling back to `scrollIntoView` when
  there is none

Both `tryScroll` and `freeze` now call `scrollToElement` instead of the
bare `scrollIntoView({ block: 'start' })`, so every scroll-to-anchor path
(initial deep link, retry loop, and freeze loop) respects the host app's
sticky header height.
