import { CssVars, Theme } from "@/registry/themes";

export const CHART_KEYS = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
] as const;

export const SIDEBAR_KEYS = [
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export const FONT_KEYS = ["font-sans", "font-serif", "font-mono"] as const;

export const SHADOW_KEYS = [
  "shadow-color",
  "shadow-opacity",
  "shadow-blur",
  "shadow-spread",
  "shadow-offset-x",
  "shadow-offset-y",
] as const;

export const FONT_STACKS: Record<(typeof FONT_KEYS)[number], string> = {
  "font-sans":
    'var(--font-inter), ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  "font-serif": 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  "font-mono":
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

const SHADOW_DEFAULTS = {
  "shadow-opacity": "0.1",
  "shadow-blur": "8px",
  "shadow-spread": "0",
  "shadow-offset-x": "0",
  "shadow-offset-y": "4px",
};

const SIDEBAR_FROM_SEMANTIC: Record<(typeof SIDEBAR_KEYS)[number], string> = {
  sidebar: "card",
  "sidebar-foreground": "foreground",
  "sidebar-primary": "primary",
  "sidebar-primary-foreground": "primary-foreground",
  "sidebar-accent": "accent",
  "sidebar-accent-foreground": "accent-foreground",
  "sidebar-border": "border",
  "sidebar-ring": "ring",
};

function rotateHue(color: string, degrees: number): string {
  const match = color.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) return color;
  const hue = (((parseFloat(match[3]) + degrees) % 360) + 360) % 360;
  return `oklch(${match[1]} ${match[2]} ${hue.toFixed(1)})`;
}

export function deriveChartColors(primary: string): string[] {
  return [0, 45, 90, 135, 180].map((degrees) => rotateHue(primary, degrees));
}

/**
 * Fill the derived keys (chart, sidebar, fonts, shadows, tracking, spacing)
 * on partial light/dark objects, leaving any existing value untouched.
 */
export function fillDerivedCssVars(lightIn: Record<string, string>, darkIn: Record<string, string>): CssVars {
  const light = { ...lightIn };
  const dark = { ...darkIn };

  const lightChart = deriveChartColors(light.primary ?? "");
  const darkChart = deriveChartColors(dark.primary ?? "");
  for (let i = 0; i < 5; i++) {
    light[CHART_KEYS[i]] ??= lightChart[i];
    dark[CHART_KEYS[i]] ??= darkChart[i];
  }
  for (const key of SIDEBAR_KEYS) {
    light[key] ??= light[SIDEBAR_FROM_SEMANTIC[key]] ?? "";
    dark[key] ??= dark[SIDEBAR_FROM_SEMANTIC[key]] ?? "";
  }
  for (const key of FONT_KEYS) {
    light[key] ??= FONT_STACKS[key];
    dark[key] ??= FONT_STACKS[key];
  }
  light["shadow-color"] ??= light.foreground ?? "";
  dark["shadow-color"] ??= dark.foreground ?? "";
  for (const [key, value] of Object.entries(SHADOW_DEFAULTS)) {
    light[key] ??= value;
    dark[key] ??= value;
  }
  light["letter-spacing"] ??= "0em";
  dark["letter-spacing"] ??= "0em";
  light.spacing ??= "0.25rem";
  dark.spacing ??= "0.25rem";
  light.radius ??= "0.5rem";
  dark.radius ??= "0.5rem";

  return {
    light: light as unknown as CssVars["light"],
    dark: dark as unknown as CssVars["dark"],
  };
}

/** Expand a preset's semantic colours and radius into the full parameter model. */
export function deriveThemeCssVars(theme: Theme): CssVars {
  const light = { ...(theme.cssVars.light as unknown as Record<string, string>) };
  const dark = { ...(theme.cssVars.dark as unknown as Record<string, string>) };
  return fillDerivedCssVars(light, dark);
}

/** The eight derived shadow tokens, presentation only (never the tweakcn contract).
 * They reference the six stored shadow parameters so the specimen responds live. */
export function buildShadowTokens(): Record<string, string> {
  const scale: Record<string, number> = {
    "shadow-2xs": 0.5,
    "shadow-xs": 0.75,
    "shadow-sm": 0.875,
    shadow: 1,
    "shadow-md": 1.25,
    "shadow-lg": 1.75,
    "shadow-xl": 2.25,
    "shadow-2xl": 2.75,
  };

  const out: Record<string, string> = {};
  for (const [name, mult] of Object.entries(scale)) {
    out[name] =
      `calc(var(--shadow-offset-x) * ${mult}) ` +
      `calc(var(--shadow-offset-y) * ${mult}) ` +
      `calc(var(--shadow-blur) * ${mult}) ` +
      `var(--shadow-spread) ` +
      `color-mix(in oklab, var(--shadow-color) calc(var(--shadow-opacity) * 100%), transparent)`;
  }
  return out;
}
