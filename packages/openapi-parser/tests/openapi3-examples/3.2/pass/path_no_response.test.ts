import { describe, expect, it } from "vite-plus/test";

import { validate } from "../../../../src/index";
import path_no_response from "./path_no_response.yaml?raw";

describe("path_no_response", () => {
  it("passes", async () => {
    const result = await validate(path_no_response);
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
    expect(result.version).toBe("3.2");
  });
});
