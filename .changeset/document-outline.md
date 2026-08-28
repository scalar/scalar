---
'@scalar/api-reference': minor
---

Resolve heading levels from a block's place in the page outline instead of hardcoding them, so a block rendered on its own starts at `h1`.

A block now assumes it is the top of the page: rendered alone, an operation's title is the `h1` and everything it contains follows beneath it. A component that renders several blocks alongside each other owns the relationship between them and anchors the outline — `Content` renders the info block above the tags and operations, so it declares `document` and the rest resolve against it. Composed into a full reference, every heading renders at the level it always has.

Also fixes two headings that never went through the heading components: the classic-layout operation title was a raw `h3`, and the classic-layout Models section label passed a `level` prop to a component that does not accept one, so it rendered no heading element at all.
