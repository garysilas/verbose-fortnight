import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { deriveThemeCssVars } from "@/registry/theme-derive";
import { buildThemeCss } from "@/registry/theme-export";
import { themes } from "@/registry/themes";

const zinc = themes.find((theme) => theme.name === "zinc")!;
const zincCssVars = deriveThemeCssVars(zinc);

function extractBlock(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return "";
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

describe("buildThemeCss", () => {
  it("matches the committed zinc fixture character for character", () => {
    const fixture = readFileSync(
      new URL("./fixtures/zinc-default.css", import.meta.url),
      "utf8"
    );

    expect(buildThemeCss({ cssVars: zincCssVars })).toBe(fixture);
  });

  it("emits a complete radius with no doubled unit", () => {
    const output = buildThemeCss({ cssVars: zincCssVars });

    expect(output).toContain("--radius: 0.5rem;");
    expect(output).not.toContain("remrem");
  });

  it("carries every tweakcn parameter in the export", () => {
    const output = buildThemeCss({ cssVars: zincCssVars });

    for (const token of [
      "chart-1",
      "chart-2",
      "chart-3",
      "chart-4",
      "chart-5",
      "sidebar",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",
      "font-sans",
      "font-serif",
      "font-mono",
      "shadow-color",
      "shadow-opacity",
      "shadow-blur",
      "shadow-spread",
      "shadow-offset-x",
      "shadow-offset-y",
      "letter-spacing",
      "spacing",
    ]) {
      expect(output).toContain(`--${token}:`);
    }
    expect(output).toContain("--shadow-2xs:");
    expect(output).toContain("--shadow-2xl:");
    expect(output).toContain("--tracking-normal:");
  });

  it("keeps globals.css :root and .dark in sync with the generator", () => {
    const globals = readFileSync(
      new URL("../src/app/globals.css", import.meta.url),
      "utf8"
    );
    const generated = buildThemeCss({ cssVars: zincCssVars });

    expect(extractBlock(globals, ":root")).toBe(extractBlock(generated, ":root"));
    expect(extractBlock(globals, ".dark")).toBe(extractBlock(generated, ".dark"));
  });

  it("throws a readable error when a token is missing instead of emitting undefined", () => {
    const partial = {
      light: { ...zincCssVars.light },
      dark: { ...zincCssVars.dark },
    };
    delete (partial.light as Record<string, unknown>)["sidebar-border"];

    expect(() => buildThemeCss({ cssVars: partial })).toThrow(
      /missing light token --sidebar-border/
    );
  });
});
