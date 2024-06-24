# @scalar/build-watch

A package to automate workspace dependency builds when working on a package.

Recommended usage is:

From workspace root:

```bash
# Start the build watcher
pnpm build:watch @scalar/working-package
```

```bash
# Run the local dev environment. Usage of the vite-workspace-restart plugin is recommended
cd package/@scalar/working-package
pnpm dev
```
