import { describe, expect, it } from "vite-plus/test";

import { validate } from "../../../../src/index";
import deprecated from "./deprecated.yaml?raw";

describe("deprecated", () => {
  it("passes", async () => {
    const result = await validate(deprecated);

    expect(result.valid).toBe(true);
    expect(result.version).toBe("3.0");
  });
});
