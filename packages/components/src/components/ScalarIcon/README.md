# Adding Icons to ScalarIcons

This component holds the collection of ScalarIcons.

When adding a new icon, the icon...

- ✅ **Should** be named using PascalCase
- ✅ **Should** have a `viewBox` attribute
- ❌ **Should not** have `width` or `height` attributes
- ✅ **Should** set either the fill (for filled icons) or the stroke (for line icons) to `currentColor`
- ❌ **Should not** hard code any colors, e.g. `fill="#000"` or `fill="black"`
- ✅ **Should** have a square aspect ratio

Additionally, when adding a _line icon_, the line icon **should** be scaled to `12px` by `12px` (e.g. `viewbox="0 0 12 12"`) and the stroke thickness **should not** be set. Line icons **should** also have `stroke-linecap="round"` and `stroke-linejoin="round"` set if applicable.

After adding the new icons run `pnpm typegen:icons` to add the icons to the list in [`icon.ts`](./icons/icons.ts).

### ✅ Good Examples

```svg
<!-- Fill Icon -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
    <path fill-rule="evenodd"
        d="M12.6 11.2h.1l3 3a1 1 0 1 1-1.4 1.5l-3-3a1 1 0 0 1-.1-.1 7 7 0 1 1 1.4-1.4zM7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z" />
</svg>
```

```svg
<!-- Line Icon -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none">
    <path stroke-linecap="round" stroke="currentColor" d="M10.7 1.3l-9.4 9.4m0-9.4l9.4 9.4" />
</svg>
```

### ❌ Bad Examples

```svg
<!-- hard codes a width / height and isn't square -->
<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="20px" viewBox="0 0 24 20" fill="currentColor">
    <path
        d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
</svg>
```

```svg
<!-- missing viewBox and hard codes a fill -->
<svg xmlns="http://www.w3.org/2000/svg" fill="#000">
    <path fill-rule="evenodd"
        d="M12.6 11.2h.1l3 3a1 1 0 1 1-1.4 1.5l-3-3a1 1 0 0 1-.1-.1 7 7 0 1 1 1.4-1.4zM7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z" />
</svg>
```

```svg
<!-- sets a stroke-width and viewBox isn't 12x12 -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
	<polyline stroke="currentColor" stroke-width="2" points="21.4,4.6 10.5,19.4 2.5,13" stroke-linecap="round"
		stroke-linejoin="round" />
</svg>
```
