# Upload API documents

Manage API descriptions in the registry from the [Scalar Dashboard](https://dashboard.scalar.com/apis), alongside [the command-line interface](cli.md).

Before you begin, [create a Scalar account](getting-started.md#create-your-scalar-account) and sign in.

## Add an API Document

1. Open **APIs** in the [dashboard](https://dashboard.scalar.com/apis) and click **Import API**.
2. Upload or paste your API description, or import it from a URL. You can import OpenAPI, AsyncAPI, or a Postman Collection.
3. Review the registry path, version, and public or private access setting, then complete the import.

Your API is now available in the registry under your team's namespace.

### Re-upload an existing API

When an upload matches an API in the selected namespace by title or registry path, the import form offers **Add to existing API?**. A registry path match can offer the existing API even when the uploaded title differs. For a path-only match, creating a new API stays selected by default: explicitly choose the existing API to add a version, or choose a different registry path to create a separate API.

Before adding to an existing API:

- Review the destination and its access setting. Adding a version keeps the existing API's public or private access.
- Review the **Version** and any overwrite warnings. Uploading an existing version replaces that version's content. To keep the existing version, choose the suggested next available version, such as **Use 1.4.1 instead**, or enter another unused version.
- Review **Set as the current version**. A newer version is selected as current by default; re-uploading the current version keeps it current. An older version is not promoted by default.

APIs linked to Git or a URL, and APIs with a different document type, cannot receive the upload as a new version through this flow. The form explains the conflict and offers **Or create new API**.

### Upload a version from API settings

1. Open your API and go to **Settings → Versions**.
2. Click **Upload version** and choose the API description to upload.
3. Review the version, overwrite warning, and **Set as the current version** option. If the version already exists, choose the suggested next available version to keep both.
4. Complete the upload. This form is fixed to the API you opened; it cannot create a different API.

**Upload version** is hidden for APIs sourced from Git or a URL. Update those sources through their configured sync instead.

## Update an API Document

1. Open [APIs](https://dashboard.scalar.com/apis) and select your API.
2. Open **Document** to edit the API description.
3. Make your changes and click **Publish** to open the publishing flow. Review the version before publishing to the registry.

You can also use the standalone [OpenAPI Editor](https://editor.scalar.com) to edit an API description and [upload it with the CLI](cli.md).

## Delete an API Document

Open [APIs](https://dashboard.scalar.com/apis), select your API, and go to **Settings > Danger zone > Delete API**. Before confirming deletion, check which documentation sites, SDKs, or MCP servers depend on the API.
