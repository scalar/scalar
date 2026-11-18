---
'@scalar/pre-post-request-scripts': patch
'scalar-app': patch
---

Validate Postman dynamic variables against patched Faker, align Django Ninja test dependencies with its runtime, and compare large desktop request bodies without expensive deep assertions.

The Postman Faker override and compatibility patch apply only inside this workspace. Published packages keep `postman-collection` external, so separately installed npm consumers still receive its Faker 5 dependency. Prebuilt vendor code is also unaffected. Workspace development uses Node.js 24, which supports loading Faker 10 ES modules from Postman’s CommonJS code.
