import { describe, expect, it } from "vite-plus/test";

import { validate } from "../../../../src/index";
import license_identifier from "./license_identifier.yaml?raw";

describe("license_identifier", () => {
  it("passes", async () => {
    const result = await validate(license_identifier);
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
    expect(result.version).toBe("3.1");
  });
});
