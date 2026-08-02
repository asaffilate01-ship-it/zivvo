import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/safeNavigation";

describe("safe internal navigation", () => {
  it("retains valid application paths", () => {
    expect(safeInternalPath("/car/123?source=notification#details")).toBe("/car/123?source=notification#details");
  });

  it.each([
    "https://attacker.example/path",
    "//attacker.example/path",
    "/\\attacker.example/path",
    "/%5c%5cattacker.example/path",
    "/%255c%255cattacker.example/path",
    "/%2f%2fattacker.example/path",
    "javascript:alert(1)",
    "browse",
  ])("rejects unsafe navigation target %s", (target) => {
    expect(safeInternalPath(target)).toBe("/");
  });

  it("uses a caller-provided safe fallback", () => {
    expect(safeInternalPath(null, "/notifications")).toBe("/notifications");
  });
});
