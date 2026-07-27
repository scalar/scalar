---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
'@scalar/galaxy': patch
---

Add credential input UIs for the AsyncAPI broker-specific security scheme types, which previously showed a "not supported yet" message in the Authentication selector. The SASL-style schemes (`userPassword`, `plain`, `scramSha256`, `scramSha512`) get a username + password form like HTTP basic, `X509` gets client certificate + private key (PEM) inputs, `symmetricEncryption`/`asymmetricEncryption` get a single key input, and `gssapi` gets a service name input. The entered credentials are persisted in the auth store with new type-specific secret shapes (`x-scalar-secret-client-certificate`, `x-scalar-secret-private-key`, `x-scalar-secret-service-name`, plus the existing username/password/token extensions) and round-trip through the merged scheme objects the same way as the OpenAPI types. The Galaxy AsyncAPI sample document now defines one scheme of each broker group so the inputs can be exercised.
