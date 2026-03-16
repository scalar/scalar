import { describe, expect, it } from "vite-plus/test";

import { usePluginManager } from "./usePluginManager";

describe("usePluginManager", () => {
  it("creates a new plugin manager if none is injected", () => {
    const result = usePluginManager();
    expect(result).toBeDefined();
  });
});
