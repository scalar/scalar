# How to Reproduce the Favicon Re-fetch Issue

## The Issue

Before the fix, the favicon was being re-fetched on every scroll event, causing unnecessary network requests.

## How to Reproduce (Before Fix)

### Option 1: Use Git to Check Out the Broken Version

```bash
# Check out the commit before the fix
git checkout c853b1ce4

# Install and build
pnpm install
pnpm build:packages

# Start the dev server
cd packages/api-reference
pnpm dev
```

### Option 2: Manually Revert the Fix

In `packages/api-reference/src/helpers/map-config-to-workspace-store.ts`, change:

**Current (Fixed):**
```typescript
import { useFavicon } from './use-favicon'

// ...

useFavicon(() => toValue(config).favicon)
```

**To (Broken):**
```typescript
import { useFavicon } from '@vueuse/core'

// ...

const favicon = computed(() => toValue(config).favicon)
useFavicon(favicon)
```

Also need to add back `computed` to the imports:
```typescript
import { type MaybeRefOrGetter, type Ref, computed, toValue, watch } from 'vue'
```

## Steps to See the Issue

1. **Open the API Reference playground**
   - Navigate to `http://localhost:5173`

2. **Open Chrome DevTools**
   - Press `F12` or right-click and select "Inspect"

3. **Go to the Network tab**
   - Click on the "Network" tab in DevTools

4. **Filter for favicon requests**
   - In the filter box, type: `favicon`
   - Or type: `png` to see image requests

5. **Clear the network log**
   - Click the 🚫 "Clear" button in the Network tab

6. **Scroll the page**
   - Slowly scroll down through the API documentation
   - Scroll up and down multiple times

7. **Observe the Network tab**
   - **Before fix**: You'll see multiple `favicon.png` requests appearing as you scroll
   - **After fix**: You'll see only 1 initial `favicon.png` request on page load, with 0 subsequent requests during scrolling

## Visual Evidence

### Before Fix (Broken)
When scrolling, you would see multiple entries like:
```
favicon.png    200    png    1.1 kB    68 ms
favicon.png    200    png    1.1 kB    68 ms
favicon.png    200    png    1.1 kB    65 ms
favicon.png    200    png    1.1 kB    72 ms
```

### After Fix (Working)
When scrolling, you see:
```
favicon.png    200    png    1.1 kB    68 ms
(no additional requests)
```

## Why This Happened

The issue occurred because:

1. **VueUse's `useFavicon()` sets up an internal watch** on the ref you pass to it
2. **The config parameter is a getter function** that returns `mergedConfig.value`
3. **`mergedConfig` is a computed** that depends on `configList` and other reactive sources
4. **`configList` is also a computed** that calls `normalizeConfigurations()` which creates new object references
5. **During scroll**, Vue components re-render, causing the computed chain to re-evaluate
6. **Even though the favicon URL string is the same**, the computed re-evaluation triggers VueUse's watcher
7. **The watcher updates the DOM** `<link rel="icon">` element
8. **The browser sees the href attribute update** and re-fetches the favicon

## The Fixes Applied

### Fix 1: Use `watch` instead of passing computed (commit 55bcfd208)
```typescript
const faviconRef = useFavicon()
watch(
  () => toValue(config).favicon,
  (newFavicon) => {
    if (newFavicon) {
      faviconRef.value = newFavicon
    }
  },
  { immediate: true },
)
```

This works because Vue's `watch` compares old vs new values before triggering.

### Fix 2: Implement custom `useFavicon` (commit 94514ad1b)
```typescript
// packages/api-reference/src/helpers/use-favicon.ts
export const useFavicon = (
  newIcon?: MaybeRefOrGetter<string | null | undefined>,
): void => {
  let currentFavicon: string | null = null
  
  const updateFavicon = (href: string | null | undefined): void => {
    if (!href || href === currentFavicon) {
      return  // Only update if URL actually changed
    }
    currentFavicon = href
    // ... update DOM
  }

  if (newIcon) {
    watch(
      () => toValue(newIcon),
      (value) => updateFavicon(value),
      { immediate: true },
    )
  }
}
```

This custom implementation:
- Tracks the current favicon URL in a closure variable
- Only updates the DOM when the URL string actually changes
- Has explicit equality checking before any DOM manipulation

## Testing the Fix

To verify the fix works:

```bash
# Make sure you're on the fixed branch
git checkout cursor/fix-favicon-refetch-on-scroll-f6a7

# Rebuild
pnpm build:packages

# Start dev server
cd packages/api-reference
pnpm dev
```

Then follow steps 1-7 above. You should see **0 favicon requests** during scrolling in the Network tab.
