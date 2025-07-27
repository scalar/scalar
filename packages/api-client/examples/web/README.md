This is intended to be something that you can run in whatever web server
you want (static files, essentially).

As an example, you can use the Python Simple HTTP Server:

```
cd examples/web
python3 -m http.server 8080
```

NOTE: Prior to running this command, build at least the api-client project
and symlink dist/browser/standalone.js into this directory

```
npm run build:standalone
cd examples/web
ln -s ../../dist/browser/standalone.js
```
