# docs-hero

Bakes the browser windows that ride behind the copy on
[`/products/docs`](../../documentation/guides/docs/index.md), into
`documentation/assets/docs-hero/`.

## Why these are bitmaps

The hero is a seam you can drag: a row of windows, each drawn twice — the
rendered API reference on one side, the same page's Markdown on the other —
with the seam cutting both. The drawings are HTML inside an `<svg>`, which a
browser has to lay out and rasterise every time the row moves. That measured
53fps against 120 for the same picture as a bitmap, so the hero ships
bitmaps and this is what makes them.

## Running it

```bash
node tooling/docs-hero/portals.mjs --write
```

Without `--write` it leaves everything in `out/` instead, next to this file
and ignored by git, which is where to look before overwriting what the hero
is using. Either way it also writes the full-resolution PNG of each face
there, since a WebP at quality 0.86 is not what you want to be judging a
hairline against.

It needs nothing built first. Playwright comes from the repository's own
`@playwright/test`, and the faces are laid out from files already in the
tree.

## Where a face comes from

Twelve files: three portals, two sides each (`reference` and `-markdown`),
two modes each (`-dark`). One generator makes all of them so the two sides
of a seam can never drift apart — the window, its chrome and its address bar
have to stay put as the seam moves, and only the page inside may change.

| Portal | Laid out from |
|--------|---------------|
| `zoom` | `documentation/assets/api-docs-static-zoom{,-dark}.svg` |
| `clerk` | `documentation/assets/clerk-docs-glass{,-dark}.svg` |
| `supabase` | `supabase.mjs`, over the Zoom artwork's stylesheet |

`extract.mjs` is what pulls an artwork's `<style>` and `<foreignObject>`
body back out so they can be laid out again at a hero card's size.

**So editing one of those artworks leaves these bitmaps stale.** The hero
kept a blue Zoom wordmark for a commit after the artworks were greyed,
because nothing re-ran this. If you change an artwork, re-run this.

Supabase has no artwork of its own — `supabase.mjs` holds its lockup, its
sidebar, its operation and its response, and the Zoom artwork supplies the
stylesheet underneath. Anything it wants to say for itself it says in its
own `css`, and anything it leaves unsaid it inherits, which is why its
method badges take the artwork's ink without being told to.

## Reading a diff

The bake is deterministic: a face whose sources have not moved comes out
byte-identical. That is worth leaning on — when you change one thing and
three files move, the two you did not expect are telling you something.
