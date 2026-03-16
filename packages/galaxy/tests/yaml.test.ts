import { describe, expect, it } from "vite-plus/test";

import galaxy from "../src/documents/3.1.yaml?raw";

describe("yaml", () => {
  it("has OpenAPI version", () => {
    expect(galaxy).toContain("openapi: 3.1.1");
  });
});
