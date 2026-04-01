# How to do OpenAPI validation (and why it matters)

To validate your OpenAPI document, download the [Scalar CLI](https://github.com/scalar/scalar/blob/main/documentation/tools/cli/getting-started.md):

```
npm -g install @scalar/cli
```

> **Note:** There’s another `scalar` CLI which is bundled with Git. If you run into naming conflicts, but never use the other CLI anyway, you can replace it like this:
>
> ```
> npm -g --force install @scalar/cli
> ```

Once installed, run the `document validate` command pointed at your OpenAPI document (no matter if it’s `JSON` or `YAML`).

```
scalar document validate galaxy.json
```

Now you have a validated OpenAPI document you can safely use however you like (or one that needs fixing 😅).

[![](https://substackcdn.com/image/fetch/$s_!Ewm-!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ffbc18eed-3e63-4d56-8c5d-67928241341a_1303x1056.png)](https://substackcdn.com/image/fetch/$s_!Ewm-!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ffbc18eed-3e63-4d56-8c5d-67928241341a_1303x1056.png)

> **Fun fact:** Scalar’s [OpenAPI editor](https://docs.scalar.com/) has validation built-in. No command line required.

## Why does OpenAPI validation matter anyways?

Not sure why you’d do the above? You’ve come to the right place. The benefits of validating your OpenAPI doc include:

* **Prevents runtime errors and bad devex**. Invalid or incomplete docs can result in confused users, broken test environments, incorrect references, and frustrated devs.
* **Ensures standards compliance.** Tools in the OpenAPI ecosystem (like Scalar) often require your doc to fit the standard. Tools might reject your doc if invalid, or worse, break when you try to use an invalid one.
* **Enables automation.** Automatically validating your OpenAPI doc unlocks automation elsewhere. You won’t need to manually upload the doc to generate mock servers, tests, codegen, and related areas of your CI/CD pipeline. All of it [just works](https://www.youtube.com/watch?v=nVqcxarP9J4&pp=0gcJCfwAo7VqN5tD).
* **Catches breaking changes.** If you have internal API standards, validating an OpenAPI doc against them can ensure these standards aren’t broken. This can be critical for proper API governance.

## How does Scalar’s OpenAPI validation work?

Can’t get enough about OpenAPI validation, huh? Well here’s how it works under the hood.

We love two things at Scalar: open source and OpenAPI. This means we’ve built a bunch of tools to work with OpenAPI and they are all open source.

Most important for validation is the `openapi-parser` [package](https://github.com/scalar/scalar/tree/main/packages/openapi-parser). It is what the CLI is relying on to actually do the validation. Once you run the command, the process looks like this:

* The parser loads the doc and ensures all `$ref` pointers are correctly resolved. These could be remote URLs needing fetching or local files needing to be read. It then replaces the references in the doc and creates a filesystem object containing the parsed doc.
* It then checks the version then uses AJV (Another JSON Validator) to check against the official [OpenAPI JSON schema](https://github.com/scalar/scalar/tree/main/packages/openapi-parser/src/schemas). There is specific validation that happens for different versions of OpenAPI.
* Once done, the CLI either returns a nice success message or transforms the AJV errors into a user-readable one.

All this is packaged into a simple to use CLI (with [much more functionality](https://github.com/scalar/scalar/blob/main/documentation/tools/cli/getting-started.md)). Also, because the `openapi-parser` is [open source](https://github.com/scalar/scalar/tree/main/packages/openapi-parser), if you wanted to implement (or modify) validation yourself, you could!

**Jul 7, 2025**
