import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { oklchToHex } from "@/components/customizer/color.utils";
import { deriveThemeCssVars } from "@/registry/theme-derive";
import { exportThemeItem } from "@/registry/theme-export";
import { importTheme, parsePayloadText, parseThemeLink } from "@/registry/theme-import";
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

  it("theme wins for fonts and radius, and the losing duplicate is reported", () => {
    const light = { ...zincCssVars.light, "font-sans": "LIGHT-FONT", radius: "1rem" };
    const dark = { ...zincCssVars.dark };
    const outcome = importTheme({
      theme: { "font-sans": "THEME-FONT", radius: "0.25rem" },
      light,
      dark,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.cssVars.light["font-sans"]).toBe("THEME-FONT");
    expect(outcome.cssVars.light.radius).toBe("0.25rem");
    expect(outcome.ignored).toContain("font-sans");
    expect(outcome.ignored).toContain("radius");
  });

  it("fails naming missing keys instead of emitting undefined", () => {
    const light = { ...zincCssVars.light } as Record<string, unknown>;
    for (const k of ["font-sans", "font-serif", "font-mono", "letter-spacing", "spacing"]) {
      delete light[k];
    }
    const outcome = importTheme({ light, dark: { ...zincCssVars.dark } });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error).toMatch(/missing keys/);
      expect(outcome.error).toMatch(/--font-sans/);
    }
  });

  it("treats a missing radius as a missing key, not a TypeError", () => {
    const light = { ...zincCssVars.light } as Record<string, unknown>;
    delete light.radius;
    const outcome = importTheme({ light, dark: { ...zincCssVars.dark } });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error).toMatch(/--radius/);
    }
  });

  it("rejects a non-string font value", () => {
    const light = { ...zincCssVars.light, "font-sans": { evil: true } } as unknown as Record<string, string>;
    const outcome = importTheme({ light, dark: { ...zincCssVars.dark } });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error).toMatch(/font-sans/);
    }
  });

  it("provides renderable swatch colours for the preview", () => {
    const payload = JSON.parse(
      readFileSync(new URL("./fixtures/tweakcn-claude.json", import.meta.url), "utf8")
    );
    const outcome = importTheme(payload);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    for (const key of ["background", "primary", "chart-1"]) {
      const value = (outcome.cssVars.light as unknown as Record<string, string>)[key];
      expect(oklchToHex(value)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("letter-spacing: light's letter-spacing wins", () => {
    const light = { ...zincCssVars.light, "letter-spacing": "0em" };
    const outcome = importTheme({
      theme: { "tracking-normal": "0.5em" },
      light,
      dark: { ...zincCssVars.dark },
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.cssVars.light["letter-spacing"]).toBe("0em");
    }
  });

  it("letter-spacing: falls back to light's tracking-normal", () => {
    const light = { ...zincCssVars.light } as Record<string, unknown>;
    delete light["letter-spacing"];
    light["tracking-normal"] = "0.2em";
    const outcome = importTheme({
      theme: { "tracking-normal": "0.5em" },
      light,
      dark: { ...zincCssVars.dark },
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.cssVars.light["letter-spacing"]).toBe("0.2em");
    }
  });

  it("letter-spacing: falls back to theme's tracking-normal", () => {
    const light = { ...zincCssVars.light } as Record<string, unknown>;
    delete light["letter-spacing"];
    const outcome = importTheme({
      theme: { "tracking-normal": "0.5em" },
      light,
      dark: { ...zincCssVars.dark },
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.cssVars.light["letter-spacing"]).toBe("0.5em");
    }
  });

  it("letter-spacing: defaults to 0em when every source is absent", () => {
    const light = { ...zincCssVars.light } as Record<string, unknown>;
    delete light["letter-spacing"];
    const outcome = importTheme({ light, dark: { ...zincCssVars.dark } });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.cssVars.light["letter-spacing"]).toBe("0em");
    }
  });
});

describe("parsePayloadText", () => {
  it("rejects a payload over 256 KB", () => {
    const big = JSON.stringify({ light: { background: "x".repeat(256 * 1024 + 1) } });
    expect(parsePayloadText(big).ok).toBe(false);
  });

  it("accepts a valid payload", () => {
    const result = parsePayloadText('{"a":1}');
    expect(result.ok).toBe(true);
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
