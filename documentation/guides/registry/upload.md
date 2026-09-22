# Upload API documents

Manage API descriptions in the registry from the [Scalar Dashboard](https://dashboard.scalar.com/apis), alongside [the command-line interface](cli.md).

Before you begin, [create a Scalar account](getting-started.md#create-your-scalar-account) and sign in.

## Add an API Document

1. Open **APIs** in the [dashboard](https://dashboard.scalar.com/apis) and click **Import API**.
2. Upload or paste your API description, or import it from a URL. You can import OpenAPI, AsyncAPI, or a Postman Collection.
3. Review the registry path, version, and public or private access setting, then complete the import.

Your API is now available in the registry under your team's namespace.

### Re-upload an existing API

When an upload matches an API in the selected namespace, the import form displays **This API already exists**. Under **Add to existing API?**, select the API to update, or choose **Or create new API** to keep it separate.

Before adding to an existing API:

- Review the destination and its access setting. Adding a version keeps the existing API's public or private access.
- Review the **Version** and any overwrite warnings. Uploading an existing version replaces that version's content.
- Review **Set as the current version**. A newer version is selected as current by default; re-uploading the current version keeps it current. An older version is not promoted by default.

APIs linked to Git or a URL, and APIs with a different document type, cannot receive the upload as a new version through this flow. The form explains the conflict and offers **Or create new API**. A registry path collision alone also does not qualify as a matching API.

## Update an API Document

1. Open [APIs](https://dashboard.scalar.com/apis) and select your API.
2. Open **Document** to edit the API description.
3. Make your changes and click **Publish** to open the publishing flow. Review the version before publishing to the registry.

You can also use the standalone [OpenAPI Editor](https://editor.scalar.com) to edit an API description and [upload it with the CLI](cli.md).

## Delete an API Document

Open [APIs](https://dashboard.scalar.com/apis), select your API, and go to **Settings > Danger zone > Delete API**. Before confirming deletion, check which documentation sites, SDKs, or MCP servers depend on the API.
