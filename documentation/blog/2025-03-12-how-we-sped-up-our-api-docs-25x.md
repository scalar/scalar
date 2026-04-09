# How we sped up our API docs 25x

API docs have a unique structure compared to other types of documentation. They have many related pages which need to be easily accessible from each other. This can mean a lot of menu items.

[![](https://substackcdn.com/image/fetch/$s_!1gF2!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F24300eff-3adc-41cd-aa69-d99e8ca9a883_1863x907.png)](https://substackcdn.com/image/fetch/$s_!1gF2!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F24300eff-3adc-41cd-aa69-d99e8ca9a883_1863x907.png)

Our users pushed this to the limit, and it was showing. They were uploading 7+ MB OpenAPI documents, some with 30+ groups, 10+ endpoints per group, and 50+ models. This was causing significant performance issues, something we know developers (the users of an API) are particularly sensitive about.

## Diagnosing our performance issues

The obvious first spot to look at is how data is imported into the client.

To check this, Amrit sprinkled `console.time` and `console.timeEnd` calls around the relevant methods. (Un)fortunately, they were fine, and he moved on to checking for issues after the data was imported and set up.

Next, he experimented by commenting out chunks of the UI until he saw load times dramatically decrease. This is how he discovered the culprit component: the [Request Sidebar](https://github.com/scalar/scalar/pull/3175/files#diff-6221b31824b2fb1816c1780e614fe3dc504ab9cc7ff6b8fcc305ac813cee8bd3).

By timing the `onBeforeMount` and `onMounted` hooks, he found that a 7 MB OpenAPI spec took 2.6 seconds to mount (way too long). Narrowing down, it was specifically the [Request Sidebar Item](https://github.com/scalar/scalar/pull/3175/files#diff-3179b1678c7f778417b849d87878807ad518233ca909f20fa108f7fe4e8784ef) that was causing the issue.

The each instance of `RequestSidebarItem` created multiple child modals and menus. These made it easy for editors to rename and delete items, but, when repeated across hundreds of sidebar items, were causing major slowdowns.

## Refactoring our sidebar to fix the performance issues

Fixing this required us to rework how users edit sidebar items.

To start, Amrit hoisted the edit and rename modals outside of `RequestSidebarItem` to ensure they were only created once. He also decided that the context menu was doing more harm than good. It enabled users to right-click to edit but didn't add functionality beyond what was already there, so he removed it.

The trickiest fix was the dropdown menu. `headlessui`, a component library we use, makes it harder to open the menu when the triggering button wasn’t a child of the component. This is why the menu was repeated inside every instance of `RequestSidebarItem`; we needed the `...` button to open it.

[![](https://substackcdn.com/image/fetch/$s_!PdzZ!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7375a878-b17b-46eb-bfd1-df44d4a8e648_1892x675.png)](https://substackcdn.com/image/fetch/$s_!PdzZ!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7375a878-b17b-46eb-bfd1-df44d4a8e648_1892x675.png)

Opening this menu in the right spot required:

1. Passing a `targetRef` to both the floating popup and dropdown menu.
2. Targeting the menu on the parent element because the button to open the menu only appeared on hover. This was resetting the position of the floating menu.
3. Manually focusing on the dropdown menu once opened and setting up a global click listener to close it.

## Maintaining functionality while improving performance

Most users probably didn't notice changes to the sidebar functionality. It looks the same and works the same.

What users with large API docs will notice is a dramatic performance improvement. Thanks to these fixes, loading times for a 7 MB OpenAPI doc went improved 25x, going from 2.6s to 0.11s.

Improving performance is a continual process. For example, immediately after this, we upgraded to Vue 3.5, which came with [reactivity system optimizations](https://blog.vuejs.org/posts/vue-3-5#reactivity-system-optimizations). As a company building for developers, we know how important performance is, so expect these improvements to continue.

**Mar 12, 2025**
