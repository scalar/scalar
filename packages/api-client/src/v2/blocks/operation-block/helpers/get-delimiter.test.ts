import { describe, expect, it } from "vite-plus/test";

import { getDelimiter } from "./get-delimiter";

describe("get-delimiter", () => {
  it("returns a space for spaceDelimited style", () => {
    expect(getDelimiter("spaceDelimited")).toBe(" ");
  });

  it("returns a pipe for pipeDelimited style", () => {
    expect(getDelimiter("pipeDelimited")).toBe("|");
  });

  it("returns a comma for form style", () => {
    expect(getDelimiter("form")).toBe(",");
  });

  it("returns a comma as the default for unknown styles", () => {
    expect(getDelimiter("unknownStyle")).toBe(",");
  });
});
