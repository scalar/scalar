---
'@scalar/aspnetcore': major
---

- The `EndpointPathPrefix` property is now obsolete and should no longer be used.
- Any existing workarounds for sub-path deployment are no longer necessary and should be removed.

- Introduced a new parameter `endpointPrefix` to replace the obsolete `EndpointPathPrefix` property in ScalarOptions.
- Automatic handling of sub-path deployments, eliminating the need for manual configurations.
- Injection of `HttpContext` during options configuration, enabling access to necessary elements from the `HttpContext`.
- Auto redirect from `/scalar` to `/scalar/` to resolve relative paths correctly.
- Cache and ETag Header for static assets.
- More `[StringSyntax]` annotations for a better developer experience.

- Fixed a typo in `Metadata` to `MetaData`. Now the configuration works as expected.

For detailed migration steps and further information, please refer to the [migration guide](https://github.com/scalar/scalar/issues/4362).
