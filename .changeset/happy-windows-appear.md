---
'@scalar/api-reference': minor
'@scalar/sidebar': minor
'@scalar/types': minor
'@scalar/workspace-store': patch
'@scalar/docusaurus': patch
'@scalar/components': patch
'@scalar/helpers': patch
---

Simplify ApiReferences state management and migrate to new shared sidebar component. Eliminates the useSidebar and useNav hooks in favour of event bubbling and centralized state management in ApiReference.vue
