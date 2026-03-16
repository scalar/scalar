import { describe, expect, it } from "vite-plus/test";

import { validate } from "../../../../src/index";
import mega from "./mega.yaml?raw";

describe("mega", () => {
  it("passes", async () => {
    const result = await validate(mega);
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
    expect(result.version).toBe("3.2");
  });
});
