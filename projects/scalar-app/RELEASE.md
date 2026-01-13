# Manual release

> ⚠️ The release is integrated in GitHub actions and new versions should be releassed automatically. This guide is for manual releases only.

Before anything, make sure to have latest `main`, installed all dependencies and did a fresh build for everything:

```bash
git pull
pnpm install
pnpm turbo build
```

Time to test the app manually. Go to the app directory and run Electron locally:

```bash
cd projects/scalar-app
pnpm dev
```

Looks good? Time to release

In order to build on toDesktop and release new version, you need access to toDeskop. Ask Marc to invite you and make sure to login:

```bash
pnpm todesktop login
pnpm todesktop whoami
```

You **have to** do a fresh build before releasing:

```bash
pnpm todesktop:build
```

Once done, you should run the automated smoke tests to check whether the app can be started:

```bash
pnpm todesktop:test
```

It'd be great to test the build manually, before rolling out a release to all our users.

Go to toDesktop, find the latest build, download it and install it on your machine!

You're confident the new version is good? Great! Time to actually release (and roll out) the new version:

```bash
pnpm todesktop:release
```

Done! You'll find the download links in the toDesktop web UI.

Any questions? Ask Hans. :-)
