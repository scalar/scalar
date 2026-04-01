# The hidden complexity of building drag and drop

When we rearrange things in the real world, we pick them up and put them down. Picking something up, moving it, and putting it down is the pattern we unconsciously rely on.

Users expect that same pattern to work in the apps they use. Unfortunately for those who have to implement this, gravity isn’t built into computers. Writing all the logic needed to drag and drop in an app is a lot of work.

We know because we recently had to go through all this work when building drag and drop into our API client. This post shows off what we built and all the work under the surface to make it happen.

## What can you drag and drop in Scalar’s API client?

Most obviously, you can move and rearrange the three main objects in our API client: collections, folders, and requests. The last two can be dragged and dropped between folders, into folders, and out of folders.

On top of this, drag and drop can be used to import OpenAPI docs. This can be done both by dragging in `.yml`, `.yaml`, and `.json` files as well as URLs.

## What’s so tricky about drag and drop?

Creating a slick drag and drop experience required us to solve the following challenges:

* **Where.** You can’t drag everything everywhere. Only certain objects can be dropped into certain spots. This means you need validation and visual feedback like drop zones, UI updates, cancellation, and error handling.
* **State management**. Both dragging and dropping needs to work with the many levels of state the API client has including collections, folders, and requests as well as their parent-child relationships. The UI aspects like collapsed versus expanded also needs to be handled.
* **Performance.** When you drag an element, your browser fires `dragover` events many times per second. If you don’t throttle these, you run potentially expensive calculations like determining drop zones, calculating positions, updating UI indicators on every single mouse movement. This can create UI jitters or lag your entire app.
* **Context.** Requests and collections aren’t simple. They include information on authentication settings, examples, test cases, response history, security schemes, and servers. Behind this is an structured OpenAPI document that needs to stay valid.

## How does our API client handle drag and drop challenges?

Rather than existing libraries like `react-dnd`, `vue-draggable`, we developed our own [@scalar/draggable package](https://github.com/scalar/scalar/tree/main/packages/draggable) with a [Draggable.vue component](https://github.com/scalar/scalar/blob/main/packages/draggable/src/Draggable.vue). To make dragging and dropping consistent across the API client, the component uses standard HTML 5 drag and drop APIs to:

* Track dragging and hovering state
* Handle drag events
* Provide visual feedback
* Customize drop zones
* Track hierarchy for validation

Here’s how we specifically handle some of the challenges with dragging and dropping we identified:

### Validation

The `Draggable.vue` component enables us to define droppable checks unique to each component and object type. For example, requests and folders can’t be dropped in lower-level containers, they can’t receive drops, and they can’t be read only:

```
// RequestSidebarItem.vue
const _isDroppable = (draggingItem, hoveredItem) => {
  if (activeWorkspace.value.isReadOnly) return false
  if (requestExamples[hoveredItem.id]) return false
  if (collections[draggingItem.id]) return false // Collections can't be dropped anywhere
  return true
}
```

Collections can be reordered but not dropped in “Drafts”, can receive requests and folders as dropped but only as children, and can’t be read only:

```
// Request.vue (for collections)
const _isDroppable = (draggingItem, hoveredItem) => {
  if (activeWorkspace.value.isReadOnly) return false
  if (!collections[draggingItem.id] && hoveredItem.offset !== 2) return false // Requests/folders must be dropped AS CHILDREN
  if (
    collections[draggingItem.id] &&
    collections[hoveredItem.id]?.spec?.info?.title === 'Drafts'
  )
    return false
  return true
}
```

The `Draggable.vue` component also has hierarchy validation to ensure an object isn’t highlighted if hovering over itself or child. It also has configurable position-based validation.

```
const getDraggableOffsets = computed(() => {
  let ceiling = 0.5
  let floor = 0.5

  // If hovered over is collection && dragging is not a collection
  if (!collections[draggingItem?.id] && isCollection.value) {
    ceiling = 1
    floor = 0
  }
  // Has children but is not a request or a collection
  else if (hasChildren.value && !isRequest.value && !isCollection.value) {
    ceiling = 0.8
    floor = 0.2
  }

  return { ceiling, floor }
})
```

All of this is implemented through props passed down to the draggable component. This ensures that the `Draggable` component is scoped to only the drag and drop logic it needs to handle and makes it more reusable.

### Visual feedback

We provide feedback at 3 spots for dragging and dropping:

1. **Above.** Uses the `dragover-above` class to show feedback when hovering above an item.
2. **Below.** Uses the `dragover-below` class to show feedback when hovering below an item.
3. **As a child.** Uses the `dragover-asChild` class when hovering to nest inside an item.

Both above and below a 3px blue semi-transparent line either above or below the item. For nesting, we highlight the entire target with a semi-transparent blue overlay.

Beyond this, there are a few styling things we do to make this look good. The styles are implemented using CSS pseudo-elements (`:after`), we use `pointer-events: none` to ensure indicators don’t interfere with drag operations, and use CSS `color-mix()` to create a subtle, semi-transparent effect that matches the UI theme.

### Performance

Because the `dragover` event fires extremely frequently and is tied to position and visual calculations, it can cause UI jitter or lag. To prevent this, we built a throttle function that:

1. Limits the `dragover` handler to firing at most once every 25 milliseconds (40 times per second)
2. Drops intermediate events during that 25ms window
3. Still ensures enough updates to maintain smooth visual feedback

This function looks like this:

```
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number,
): T => {
  let inThrottle: boolean
  let lastResult: any

  return ((...args) => {
    if (!inThrottle) {
      inThrottle = true

      lastResult = func(...args)

      setTimeout(() => {
        inThrottle = false
      }, limit)
    }

    return lastResult
  }) as T
}
```

It takes a function and a time limit, returns a wrapped version that only executes once within the time window, and tracks whether we’re still in the throttle.

This is enough to provide smooth (40 fps) animations while still significantly reducing the processing overhead of raw `dragover` events.

### State management

The core `Draggable.vue` component doesn’t handle state, only hover positions as well as drag start and end events with that position information.

The actual state management is lifted to the parent component `Request.vue`. This prevents drops in read-only mode, handles collection-specific rules, and manages the hierarchical relationship between collections, folders, and requests. It also handles different mutation types depending on the target.

```
const mutate = (uid: string, childUids: string[]) => {
  if (collections[uid]) collectionMutators.edit(uid, 'childUids', childUids)
  else if (folders[uid]) folderMutators.edit(uid, 'childUids', childUids)
}
```

This structure isolates drag and drop from our business logic, ensures we handle OpenAPI document validity constraints, and provides us the flexibility to add new drag and drop rules without modifying the base component.

## The undersurface complexity of drag and drop

Although drag and drop seems simple on the surface, there is a lot of complexity to make it work nicely. It required us to handle OpenAPI document validation, performance, visual feedback, hierarchy, and state management.

This is representative of one of many of the little optimizations we do to try to make working with APIs as easy as possible.

**Mar 19, 2025**
