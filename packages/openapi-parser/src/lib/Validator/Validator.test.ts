import { describe, expect, it } from "vite-plus/test";

import { Validator } from "./Validator";

describe("Validator", () => {
  it("returns all supported versions", () => {
    expect(Validator.supportedVersions).toMatchObject([
      "2.0",
      "3.0",
      "3.1",
      "3.2",
    ]);
  });
});
