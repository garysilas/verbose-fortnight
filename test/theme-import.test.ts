import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { deriveThemeCssVars } from "@/registry/theme-derive";
import { exportThemeItem } from "@/registry/theme-export";
import { importTheme, parseThemeLink } from "@/registry/theme-import";
import { themes } from "@/registry/themes";

const zinc = themes.find((t) => t.name === "zinc")!;
const zincCssVars = deriveThemeCssVars(zinc);

describe("exportThemeItem + importTheme", () => {
  it("round-trips our own export byte-identically", () => {
    const exported = exportThemeItem({ theme: "zinc", cssVars: zincCssVars });
    const imported = importTheme(exported);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    const reexported = exportThemeItem({
      theme: imported.theme,
      cssVars: imported.cssVars,
    });
    expect(JSON.stringify(reexported)).toBe(JSON.stringify(exported));
  });

  it("accepts all three import shapes", () => {
    const bare = { light: { ...zincCssVars.light }, dark: { ...zincCssVars.dark } };
    const cssVarsObject = { ...bare, theme: { radius: "0.5rem" } };
    const registryItem = { name: "zinc", type: "registry:style", cssVars: bare };

    for (const shape of [bare, cssVarsObject, registryItem]) {
      const outcome = importTheme(shape);
      expect(outcome.ok).toBe(true);
    }
  });

  it("imports a foreign preset and reports derived keys and the css block", () => {
    const payload = JSON.parse(
      readFileSync(new URL("./fixtures/tweakcn-claude.json", import.meta.url), "utf8")
    );
    const outcome = importTheme(payload);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.ignored).toContain("css");
    expect(outcome.ignored).toContain("shadow-2xs");
    expect(outcome.ignored).toContain("shadow-2xl");
    expect(outcome.ignored).toContain("tracking-normal");
    expect(outcome.ignored).toContain("tracking-tight");
    expect(outcome.ignored).toContain("tracking-widest");

    // primary from light, normalised to three decimals L/C and one H.
    expect(outcome.cssVars.light.primary).toMatch(
      /^oklch\(\d+\.\d{3} \d+\.\d{3} \d+(\.\d)?\)$/
    );
    expect(outcome.cssVars.dark.primary).not.toBe(outcome.cssVars.light.primary);
  });

  it("fails with a readable message on a missing light block or a non-colour", () => {
    expect(importTheme({}).ok).toBe(false);
    const bad = importTheme({
      light: { background: "not-a-colour" },
      dark: {},
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.error).toMatch(/background/);
    }
  });

  it("normalises foreign colours to our canonical oklch precision", () => {
    const light = { ...zincCssVars.light, background: "oklch(0.9818 0.0054 95.0986)" };
    const dark = { ...zincCssVars.dark };
    const outcome = importTheme({ light, dark });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.cssVars.light.background).toBe("oklch(0.982 0.005 95.1)");
    }
  });
});

describe("parseThemeLink", () => {
  it("accepts the two link shapes and rejects editor links", () => {
    expect(parseThemeLink("https://tweakcn.com/themes/claude")).toBe("claude");
    expect(parseThemeLink("https://tweakcn.com/r/themes/claude.json")).toBe("claude");
    expect(parseThemeLink("https://tweakcn.com/editor/theme/claude")).toBe(null);
    expect(parseThemeLink("https://evil.com/r/themes/claude.json")).toBe(null);
    expect(parseThemeLink("https://tweakcn.com/themes/bad/id")).toBe(null);
  });
});
