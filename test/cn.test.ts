import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("keeps the last conflicting utility (p-2 p-4 -> p-4)", () => {
    expect(cn("p-2 p-4")).toBe("p-4");
  });

  it("keeps the last conflicting shadow (shadow-sm shadow-md -> shadow-md)", () => {
    expect(cn("shadow-sm shadow-md")).toBe("shadow-md");
  });
});
