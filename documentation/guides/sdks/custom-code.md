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

A common shape is an endpoint that hands back a signed URL, which the caller is then expected to `PUT` the file to. Two calls, plus the bookkeeping in between, every time anyone uploads anything. Custom code turns that into a single method on the generated client.

Take an OpenAPI document with the two halves of a video upload:

```yaml
openapi: 3.1.0
info:
  title: Acme
  version: 1.0.0
servers:
  - url: https://api.acme.com
paths:
  /videos/uploads:
    post:
      operationId: createVideoUpload
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
              schema: { $ref: '#/components/schemas/VideoUpload' }
  /videos/{videoId}:
    get:
      operationId: getVideo
      summary: Retrieve a video
      parameters:
        - name: videoId
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Video' }
components:
  schemas:
    VideoUpload:
      type: object
      required: [videoId, uploadUrl]
      properties:
        videoId: { type: string }
        uploadUrl: { type: string, format: uri }
    Video:
      type: object
      required: [id, status]
      properties:
        id: { type: string }
        status: { type: string, enum: [processing, ready] }
        playbackUrl: { type: string }
```

That generates `videos.createUpload` (`videos.create_upload` in Python) and `videos.retrieve`. The upload itself is not in the OpenAPI document at all, because it goes to the storage host rather than to your API.

### 1. Write the helper

Add a new file in a directory the generator does not write, so it never collides with generated output. Subclassing the generated resource keeps the existing methods and adds yours next to them:

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

```ts src/custom/videos.ts
import { Videos, type Video, type VideoCreateUploadParams } from '../resources/videos';

/** Everything `videos.createUpload` takes, plus the bytes to store at the signed URL. */
export interface VideoUploadParams extends VideoCreateUploadParams {
  /** File contents to send to the signed URL. */
  file: BodyInit;
}

/** The generated `videos` resource, plus a one-call upload. */
export class VideosWithUpload extends Videos {
  async upload({ file, ...params }: VideoUploadParams): Promise<Video> {
    const { videoId, uploadUrl } = await this.createUpload(params);

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

    return this.retrieve(videoId);
  }
}
```

  </scalar-tab>
  <scalar-tab title="Python">

```python src/acme/custom/videos.py
from __future__ import annotations

import httpx

from ..types.video import Video
from ..resources.videos import VideosResource, AsyncVideosResource

__all__ = ["VideosWithUpload", "AsyncVideosWithUpload"]


class VideosWithUpload(VideosResource):
    """The generated ``videos`` resource, plus a one-call upload."""

    def upload(self, *, filename: str, file: bytes, content_type: str | None = None) -> Video:
        upload = self.create_upload(
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

        return self.retrieve(video_id=upload.video_id)


class AsyncVideosWithUpload(AsyncVideosResource):
    """Async twin of :class:`VideosWithUpload`."""

    async def upload(self, *, filename: str, file: bytes, content_type: str | None = None) -> Video:
        upload = await self.create_upload(
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

        return await self.retrieve(video_id=upload.video_id)
```

Python also needs an empty `src/acme/custom/__init__.py` so the directory is a package. The generated `pyproject.toml` ships everything under `src/acme`, so nothing about packaging changes.

  </scalar-tab>
</scalar-tabs>

### 2. Point the client at it

One edit in the generated client hands out your subclass instead of the generated one. This is the only generated file the example touches:

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

In `src/client.ts`:

```diff
+import { VideosWithUpload } from './custom/videos';

-  videos: Videos = new Videos(this);
+  videos: VideosWithUpload = new VideosWithUpload(this);
```

  </scalar-tab>
  <scalar-tab title="Python">

In `src/acme/_client.py`:

```diff
     @cached_property
-    def videos(self) -> "VideosResource":
+    def videos(self) -> "VideosWithUpload":
         with _RESOURCE_IMPORT_LOCK:
-            from .resources.videos import VideosResource
-        return VideosResource(self)
+            from .custom.videos import VideosWithUpload
+        return VideosWithUpload(self)
```

The async client has the same block a little further down, returning `AsyncVideosWithUpload`.

  </scalar-tab>
</scalar-tabs>

### 3. Call it

Callers get one method, fully typed, next to every generated one:

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

```ts
// `file` is a File from an <input type="file">, or any other BodyInit.
const video = await client.videos.upload({
  filename: file.name,
  contentType: file.type,
  file,
});

console.log(video.status); // 'ready'
```

  </scalar-tab>
  <scalar-tab title="Python">

```python
with open("demo.mp4", "rb") as handle:
    video = client.videos.upload(
        filename="demo.mp4",
        content_type="video/mp4",
        file=handle.read(),
    )

print(video.status)  # 'ready'
```

  </scalar-tab>
</scalar-tabs>

The helper file is new, so every rebuild leaves it alone. The wiring edit is a few lines inside a generated file, which the merge carries forward on each build, and which only conflicts if the generator changes those same lines, for example when the resource is renamed in your OpenAPI document.

### Prefer a plain function when you do not want to touch generated files

If you would rather not edit generated code at all, skip the subclass and export a function that takes the client. It reads as `uploadVideo(client, ...)` instead of `client.videos.upload(...)`, and nothing in the repository conflicts, ever:

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

```ts src/custom/upload-video.ts
import type { Acme } from '../client';
import type { Video } from '../resources/videos';
import type { VideoUploadParams } from './videos';

export async function uploadVideo(client: Acme, { file, ...params }: VideoUploadParams): Promise<Video> {
  const { videoId, uploadUrl } = await client.videos.createUpload(params);

  // ... the same PUT to `uploadUrl` as above ...

  return client.videos.retrieve(videoId);
}
```

The generated `package.json` exports every subpath, so consumers import it as `import { uploadVideo } from 'acme/custom/upload-video'`.

  </scalar-tab>
  <scalar-tab title="Python">

```python src/acme/custom/upload_video.py
from __future__ import annotations

from typing import TYPE_CHECKING

from ..types.video import Video

if TYPE_CHECKING:
    from .._client import Acme


def upload_video(client: "Acme", *, filename: str, file: bytes, content_type: str | None = None) -> Video:
    upload = client.videos.create_upload(filename=filename)

    # ... the same PUT to `upload.upload_url` as above ...

    return client.videos.retrieve(video_id=upload.video_id)
```

The client is imported under `TYPE_CHECKING` so the helper never imports it at runtime, which is what keeps it safe to use alongside the subclass wiring above. Consumers import it as `from acme.custom.upload_video import upload_video`.

  </scalar-tab>
</scalar-tabs>

## Tips

- **Keep custom code separate where you can.** New files in their own paths never conflict, so prefer adding a helper file over editing deep inside a generated one. Pick a directory the generator does not write, such as `src/custom/`, and check your repository first: some TypeScript SDKs already generate a `src/lib/`.
- **Never send your API credentials to a third-party host.** Signed upload URLs point at storage providers, so send those requests with a plain `fetch` or `httpx` call rather than through the generated client, which attaches your authentication to everything it sends.
- **Custom CI workflows count as custom code.** A workflow you add under `.github/workflows/` is carried forward like any other file, which is how you publish to an internal registry. See [Private Registries](publishing/private-registries.md).
- **Review the release pull request.** It is the single place where generated changes and your customizations come together, so it is the natural review point before anything releases or [publishes](publishing/overview.md).
- **Custom code is per repository.** Each target keeps its own customizations in its own repository.
