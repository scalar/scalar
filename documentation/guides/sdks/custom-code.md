# Custom Code

Generated SDKs rarely cover every need. You might add a convenience method, tweak a type, write a helper, or adjust the README. Scalar lets you edit generated code directly and **carries your changes forward** on every regeneration, so you customize the SDK without forking it or losing future updates.

This works on any target [linked to a GitHub repository](publishing/github.md).

## How it works

Each build does a three-way merge: it compares the previously generated code, the newly generated code, and your repository's current state, then lands the combination on the `scalar-next` branch. Untouched generated files update cleanly; your edits are preserved; brand-new files you added are left alone.

<scalar-steps>
  <scalar-step id="custom-edit" title="Edit the generated code">

In your SDK repository, change generated files or add new ones, the same as any other code. Commit to **`scalar-next`**, the integration branch — directly or through a pull request against it. Never commit to `scalar-generated`, which holds pristine generator output.

  </scalar-step>

  <scalar-step id="custom-rebuild" title="Rebuild">

The next build regenerates from the latest OpenAPI document and merges your changes into `scalar-next`. Your edits ride along instead of being overwritten.

  </scalar-step>

  <scalar-step id="custom-review" title="Review and merge">

Review the release pull request, which Scalar keeps open from `scalar-next` against your default branch. Most changes merge automatically; only real conflicts need attention.

  </scalar-step>
</scalar-steps>

## Resolving conflicts

A conflict happens when a regenerated file changes the same lines you edited (for example, you customized a method whose signature then changed in the API). When that happens, the target's build is marked as having conflicts and the merge is parked on the `scalar-merge-conflict` branch. You can resolve it two ways:

- **In the dashboard**: open the target's conflicts view and pick the generated or your version for each conflicting file.
- **In GitHub**: resolve the conflict on the `scalar-merge-conflict` pull request like any other Git merge conflict.

Once resolved, the merge lands on `scalar-next` and the release pull request reflects the merged result.

## Example: combining two calls into one

A common shape is an endpoint that hands back a signed URL, which the caller is then expected to `PUT` the file to, followed by a second call to read the stored record back. Three steps, spread across two resources, every time anyone uploads a file. Custom code turns that into a single method on the generated client.

Take an OpenAPI document with the two halves:

```yaml
openapi: 3.1.0
info:
  title: Acme
  version: 1.0.0
servers:
  - url: https://api.acme.com
security:
  - apiKey: []
paths:
  /uploads:
    post:
      operationId: createUpload
      summary: Create a signed upload URL
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [filename]
              properties:
                filename: { type: string }
                contentType: { type: string }
      responses:
        '200':
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Upload' }
  /attachments/{attachmentId}:
    get:
      operationId: getAttachment
      summary: Retrieve an attachment
      parameters:
        - name: attachmentId
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Attachment' }
components:
  securitySchemes:
    apiKey:
      type: http
      scheme: bearer
  schemas:
    Upload:
      type: object
      required: [attachmentId, uploadUrl]
      properties:
        attachmentId: { type: string }
        uploadUrl: { type: string, format: uri }
    Attachment:
      type: object
      required: [id, status]
      properties:
        id: { type: string }
        status: { type: string, enum: [pending, stored] }
        downloadUrl: { type: string }
```

That generates `client.uploads.create` and `client.attachments.retrieve`. The `PUT` in between is not in the OpenAPI document at all, because it goes to the storage host rather than to your API.

Note that the combined method belongs to neither generated resource, which is the usual case. So it goes on a resource of its own, which the generator does not know about and therefore never rewrites.

### 1. Write the helper

Add a new file in a directory the generator does not write, so it never collides with generated output. Extending `APIResource` is all it takes to get a resource that can reach the rest of the client:

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

```ts src/custom/files.ts
import { APIResource } from '../resource';
import type { Attachment } from '../resources/attachments';
import type { UploadCreateParams } from '../resources/uploads';

/** Everything `uploads.create` takes, plus the bytes to store at the signed URL. */
export interface FileUploadParams extends UploadCreateParams {
  /** File contents to send to the signed URL. */
  file: BodyInit;
}

/** A resource that exists only in custom code, wrapping the three steps of an upload. */
export class Files extends APIResource {
  async upload({ file, ...params }: FileUploadParams): Promise<Attachment> {
    const { attachmentId, uploadUrl } = await this._client.uploads.create(params);

    // The signed URL points at the storage host rather than at your API, so it is sent with a
    // plain `fetch`. Going through the client would attach your API credentials to a
    // third-party request and prefix the configured base URL.
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      ...(params.contentType ? { headers: { 'Content-Type': params.contentType } } : {}),
    });

    if (!response.ok) {
      throw new Error(`Upload to the signed URL failed with ${response.status}`);
    }

    return this._client.attachments.retrieve(attachmentId);
  }
}
```

  </scalar-tab>
  <scalar-tab title="Python">

```python src/acme/custom/files.py
from __future__ import annotations

import httpx

from .._resource import SyncAPIResource, AsyncAPIResource
from ..types.attachment import Attachment

__all__ = ["FilesResource", "AsyncFilesResource"]


class FilesResource(SyncAPIResource):
    """A resource that exists only in custom code, wrapping the three steps of an upload."""

    def upload(self, *, filename: str, file: bytes, content_type: str | None = None) -> Attachment:
        upload = self._client.uploads.create(
            filename=filename,
            **({"content_type": content_type} if content_type is not None else {}),
        )

        # The signed URL points at the storage host rather than at your API, so it is sent with a
        # bare httpx call. Going through the client would attach your API credentials to a
        # third-party request.
        response = httpx.put(
            upload.upload_url,
            content=file,
            headers={"Content-Type": content_type} if content_type is not None else None,
        )
        response.raise_for_status()

        return self._client.attachments.retrieve(attachment_id=upload.attachment_id)


class AsyncFilesResource(AsyncAPIResource):
    """Async twin of :class:`FilesResource`."""

    async def upload(self, *, filename: str, file: bytes, content_type: str | None = None) -> Attachment:
        upload = await self._client.uploads.create(
            filename=filename,
            **({"content_type": content_type} if content_type is not None else {}),
        )

        async with httpx.AsyncClient() as http:
            response = await http.put(
                upload.upload_url,
                content=file,
                headers={"Content-Type": content_type} if content_type is not None else None,
            )
        response.raise_for_status()

        return await self._client.attachments.retrieve(attachment_id=upload.attachment_id)
```

Python also needs an empty `src/acme/custom/__init__.py` so the directory is a package. The generated `pyproject.toml` ships everything under `src/acme`, so nothing about packaging changes.

  </scalar-tab>
</scalar-tabs>

### 2. Hang it off the client

Adding the accessor is the only edit to a generated file, and it only ever adds lines:

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

In `src/client.ts`, next to the generated resource properties:

```diff
+import { Files } from './custom/files';

   uploads: Uploads = new Uploads(this);
   attachments: Attachments = new Attachments(this);
+  files: Files = new Files(this);
```

  </scalar-tab>
  <scalar-tab title="Python">

In `src/acme/_client.py`, next to the generated resource properties:

```diff
+    @cached_property
+    def files(self) -> "FilesResource":
+        with _RESOURCE_IMPORT_LOCK:
+            from .custom.files import FilesResource
+        return FilesResource(self)
```

The async client has the same block a little further down, returning `AsyncFilesResource`.

  </scalar-tab>
</scalar-tabs>

### 3. Call it

Callers get one method, fully typed, next to every generated one:

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

```ts
// `file` is a File from an <input type="file">, or any other BodyInit.
const attachment = await client.files.upload({
  filename: file.name,
  contentType: file.type,
  file,
});

console.log(attachment.status); // 'stored'
```

  </scalar-tab>
  <scalar-tab title="Python">

```python
with open("report.pdf", "rb") as handle:
    attachment = client.files.upload(
        filename="report.pdf",
        content_type="application/pdf",
        file=handle.read(),
    )

print(attachment.status)  # 'stored'
```

  </scalar-tab>
</scalar-tabs>

The helper file is new, so every rebuild leaves it alone. The accessor is a few added lines inside a generated file, which the merge carries forward on each build, and which only conflicts if the generator rewrites those same lines.

If your combined method does fit an existing generated resource, you can subclass that resource instead of `APIResource` and swap it in at the same spot, which keeps every generated method alongside yours.

### Prefer a plain function when you do not want to touch generated files

If you would rather not edit generated code at all, skip the resource and export a function that takes the client. It reads as `uploadFile(client, ...)` instead of `client.files.upload(...)`, and nothing in the repository conflicts, ever:

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

```ts src/custom/upload-file.ts
import type { Acme } from '../client';
import type { Attachment } from '../resources/attachments';
import type { FileUploadParams } from './files';

export async function uploadFile(
  client: Acme,
  { file, ...params }: FileUploadParams,
): Promise<Attachment> {
  const { attachmentId, uploadUrl } = await client.uploads.create(params);

  // ... the same PUT to `uploadUrl` as above ...

  return client.attachments.retrieve(attachmentId);
}
```

The generated `package.json` exports every subpath, so consumers import it as `import { uploadFile } from 'acme/custom/upload-file'`.

  </scalar-tab>
  <scalar-tab title="Python">

```python src/acme/custom/upload_file.py
from __future__ import annotations

from typing import TYPE_CHECKING

from ..types.attachment import Attachment

if TYPE_CHECKING:
    from .._client import Acme


def upload_file(
    client: "Acme", *, filename: str, file: bytes, content_type: str | None = None
) -> Attachment:
    upload = client.uploads.create(filename=filename)

    # ... the same PUT to `upload.upload_url` as above ...

    return client.attachments.retrieve(attachment_id=upload.attachment_id)
```

The client is imported under `TYPE_CHECKING` so the helper never imports it at runtime, which is what keeps it safe to use alongside the resource wiring above. Consumers import it as `from acme.custom.upload_file import upload_file`.

  </scalar-tab>
</scalar-tabs>

## Tips

- **Keep custom code separate where you can.** New files in their own paths never conflict, so prefer adding a helper file over editing deep inside a generated one. Pick a directory the generator does not write, such as `src/custom/`, and check your repository first: some TypeScript SDKs already generate a `src/lib/`.
- **Never send your API credentials to a third-party host.** Signed upload URLs point at storage providers, so send those requests with a plain `fetch` or `httpx` call rather than through the generated client, which attaches your authentication to everything it sends.
- **Custom CI workflows count as custom code.** A workflow you add under `.github/workflows/` is carried forward like any other file, which is how you publish to an internal registry. See [Private Registries](publishing/private-registries.md).
- **Review the release pull request.** It is the single place where generated changes and your customizations come together, so it is the natural review point before anything releases or [publishes](publishing/overview.md).
- **Custom code is per repository.** Each target keeps its own customizations in its own repository.
