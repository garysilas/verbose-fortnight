import { CssVars } from "@/registry/themes";
import {
  CHART_KEYS,
  FONT_KEYS,
  SHADOW_KEYS,
  SIDEBAR_KEYS,
  buildShadowTokens,
} from "@/registry/theme-derive";
import { PARAMETER_KEYS, normaliseColor } from "@/registry/theme-import";

const COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
] as const;

const RHYTHM_TOKENS = ["letter-spacing", "spacing"] as const;

interface ThemeCssConfig {
  cssVars: {
    light: Partial<CssVars["light"]>;
    dark: Partial<CssVars["dark"]>;
  };
}

function modeLines(
  mode: Record<string, string | undefined>,
  includeRadius: boolean
): string[] {
  const lines: string[] = [];
  for (const token of COLOR_TOKENS) {
    lines.push(`  --${token}: ${mode[token]};`);
  }
  for (const token of CHART_KEYS) {
    lines.push(`  --${token}: ${mode[token]};`);
  }
  for (const token of SIDEBAR_KEYS) {
    lines.push(`  --${token}: ${mode[token]};`);
  }
  for (const token of FONT_KEYS) {
    lines.push(`  --${token}: ${mode[token]};`);
  }
  for (const token of SHADOW_KEYS) {
    lines.push(`  --${token}: ${mode[token]};`);
  }
  for (const token of RHYTHM_TOKENS) {
    lines.push(`  --${token}: ${mode[token]};`);
  }
  if (includeRadius) {
    lines.push(`  --radius: ${mode.radius ?? "0.5rem"};`);
  }
  return lines;
}

export function buildThemeCss(config: ThemeCssConfig): string {
  const light = config.cssVars.light as Record<string, string | undefined>;
  const dark = config.cssVars.dark as Record<string, string | undefined>;

  // Fail loudly instead of emitting `--token: undefined;` from a partial config.
  const requiredTokens = [
    ...COLOR_TOKENS,
    ...CHART_KEYS,
    ...SIDEBAR_KEYS,
    ...FONT_KEYS,
    ...SHADOW_KEYS,
    ...RHYTHM_TOKENS,
  ];
  for (const token of requiredTokens) {
    if (light[token] === undefined) {
      throw new Error(`buildThemeCss: missing light token --${token}`);
    }
    if (dark[token] === undefined) {
      throw new Error(`buildThemeCss: missing dark token --${token}`);
    }
  }
  if (light.radius === undefined) {
    throw new Error("buildThemeCss: missing light token --radius");
  }

  const lines: string[] = [];
  lines.push("/* Omit the two imports if your CSS file already includes them. */");
  lines.push('@import "tailwindcss";');
  lines.push('@import "tw-animate-css";');
  lines.push("");
  lines.push("@custom-variant dark (&:is(.dark *));");
  lines.push("");

  lines.push(":root {");
  lines.push(...modeLines(light, true));
  lines.push("}");
  lines.push("");

  lines.push(".dark {");
  lines.push(...modeLines(dark, false));
  lines.push("}");
  lines.push("");

  lines.push("@theme inline {");
  for (const token of COLOR_TOKENS) {
    lines.push(`  --color-${token}: var(--${token});`);
  }
  for (const token of CHART_KEYS) {
    lines.push(`  --color-${token}: var(--${token});`);
  }
  for (const token of SIDEBAR_KEYS) {
    lines.push(`  --color-${token}: var(--${token});`);
  }
  for (const token of FONT_KEYS) {
    lines.push(`  --${token}: var(--${token});`);
  }
  const shadows = buildShadowTokens();
  for (const [name, value] of Object.entries(shadows)) {
    lines.push(`  --${name}: ${value};`);
  }
  lines.push("  --tracking-normal: var(--letter-spacing);");
  lines.push("  --spacing: var(--spacing);");
  lines.push("  --radius-lg: var(--radius);");
  lines.push("  --radius-md: calc(var(--radius) - 2px);");
  lines.push("  --radius-sm: calc(var(--radius) - 4px);");
  lines.push("}");

  return lines.join("\n") + "\n";
}

function canonicalise(value: string): string {
  return normaliseColor("", value) ?? value;
}

export function exportThemeItem(config: {
  theme: string;
  cssVars: {
    light: Partial<CssVars["light"]>;
    dark: Partial<CssVars["dark"]>;
  };
}) {
  const light = config.cssVars.light as Record<string, string | undefined>;
  const dark = config.cssVars.dark as Record<string, string | undefined>;
  const lightOut: Record<string, string> = {};
  const darkOut: Record<string, string> = {};

  for (const key of PARAMETER_KEYS) {
    lightOut[key] = canonicalise(light[key] ?? "");
    darkOut[key] = canonicalise(dark[key] ?? "");
  }

  return {
    name: config.theme,
    type: "registry:style",
    cssVars: { light: lightOut, dark: darkOut },
  };
}
