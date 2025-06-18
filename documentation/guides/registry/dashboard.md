# Dashboard
This guide will help you interact with our registry with our dashboard on scalar.com, which can be done alongside our [CLI](/scalar/scalar-cli/getting-started).

Make sure you have created a Scalar Account & are logged in ([see create account guide](/scalar/scalar-registry/getting-started#create-your-scalar-account))

## Add an OpenAPI Document
Now let's add an OpenAPI document to the registry ✨

From the [dashboard](https://dashboard.scalar.com) click Import API from the right hand pane, or navigate to registry in the sidebar under Products then click Create new API

![Scalar Import OpenAPI Document Modal](https://api.scalar.com/cdn/images/UCkGjASrXpR8OxgWEj32i/WnMVG8hrR_f-6t-lOtDYb.png "Scalar Import OpenAPI Document")

You can upload any version of OpenAPI (even Swagger) or a Postman Collection!

![Scalar Importing OpenAPI Document](https://api.scalar.com/cdn/images/UCkGjASrXpR8OxgWEj32i/RWZLxUdaySzCyELtwopSq.png "Scalar Importing OpenAPI Document")

![Scalar Imported OpenAPI Document](https://api.scalar.com/cdn/images/UCkGjASrXpR8OxgWEj32i/glhdU91VygnDIlywcnUsL.png "Scalar Imported OpenAPI Document")

Awesome, now your OpenAPI Document is in the Scalar Registry under your companies namespace!


## Update an OpenAPI Document
You can use our [OpenAPI Editor](https://editor.scalar.com) to make changes to your OpenAPI Document, or click Edit Document from the [Registry Page](https://dashboard.scalar.com/registry).

![Scalar Registry Overview](https://api.scalar.com/cdn/images/UCkGjASrXpR8OxgWEj32i/glhdU91VygnDIlywcnUsL.png "Scalar Registry Overview")

![Scalar Document Editor](https://api.scalar.com/cdn/images/UCkGjASrXpR8OxgWEj32i/azzKtVC0Ew1_94JdMKTc9.png "Scalar Document Editor")

Once you make edits, you can click Publish in the top right to upsert a new version to the registry

![Scalar Upsert Document](https://api.scalar.com/cdn/images/UCkGjASrXpR8OxgWEj32i/ToaCj4ycSecX799jl6DZ7.png "Scalar Upsert Document")

## Delete an OpenAPI Document
You can delete an OpenAPI document from the Registry > Overview page, however please consider the downstream effects of which products are depending on that OpenAPI document before deleting that resource.
