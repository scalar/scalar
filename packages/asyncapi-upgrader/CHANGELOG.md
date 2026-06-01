# @scalar/asyncapi-upgrader

## 0.1.0

### Minor Changes

- [#9303](https://github.com/scalar/scalar/pull/9303): feat: add `@scalar/asyncapi-upgrader` to bump AsyncAPI documents to the latest version
- [#9356](https://github.com/scalar/scalar/pull/9356): feat: actually upgrade AsyncAPI 1.x documents to 2.x (servers, channels, parameters, stream, events) instead of only bumping the version string
- [#9357](https://github.com/scalar/scalar/pull/9357): feat: actually upgrade AsyncAPI 2.x documents to 3.0 (servers, channels, operations, security/OAuth) instead of only bumping the version string
- [#9358](https://github.com/scalar/scalar/pull/9358): feat: rewrite operation `messages` $refs from `#/components/messages/X` to `#/channels/{id}/messages/X` on 3.0 → 3.1 upgrade (the channel-scoped form 3.1 clarified as required)
