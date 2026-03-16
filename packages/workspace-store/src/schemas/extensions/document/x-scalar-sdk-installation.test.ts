import { Value } from "@scalar/typebox/value";
import { describe, expect, it } from "vite-plus/test";

import { XScalarSdkInstallationSchema } from "./x-scalar-sdk-installation";

describe("XScalarSdkInstallationSchema", () => {
  it("supports an array of installation instructions", () => {
    const result = Value.Parse(XScalarSdkInstallationSchema, {
      "x-scalar-sdk-installation": [
        {
          lang: "Node",
          description: "Install our custom SDK for Node.js from npm",
          source: "npm install @your-awesome-company/sdk",
        },
      ],
    });

    expect(result).toEqual({
      "x-scalar-sdk-installation": [
        {
          lang: "Node",
          description: "Install our custom SDK for Node.js from npm",
          source: "npm install @your-awesome-company/sdk",
        },
      ],
    });
  });
});
