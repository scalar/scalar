# TLS test fixtures

These self-signed certificates and private keys are public test data, not deployment credentials.

`localhost` is trusted by the integration test's HTTPS server and is also used as its client certificate. Its subject alternative names cover `localhost` and `127.0.0.1`. `untrusted` is a separate self-signed client that must fail authentication. Both certificates have a long validity period to keep the fixtures deterministic.
