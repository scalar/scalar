import { describe, expect, it } from "vite-plus/test";

import { validate } from "../../../../src/index";
import minimal_paths from "./minimal_paths.yaml?raw";

describe("minimal_paths", () => {
  it("passes", async () => {
    const result = await validate(minimal_paths);
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
    expect(result.version).toBe("3.1");
  });
});
