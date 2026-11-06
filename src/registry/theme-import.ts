import { CssVars } from "@/registry/themes";
import {
  CHART_KEYS,
  FONT_KEYS,
  SHADOW_KEYS,
  SIDEBAR_KEYS,
} from "@/registry/theme-derive";

const SEMANTIC_COLOR_KEYS = [
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

/** The 44 keys this editor supports, in canonical export order. */
export const PARAMETER_KEYS = [
  ...SEMANTIC_COLOR_KEYS,
  ...CHART_KEYS,
  ...SIDEBAR_KEYS,
  "radius",
  ...FONT_KEYS,
  ...SHADOW_KEYS,
  "letter-spacing",
  "spacing",
] as const;

/** Keys tweakcn derives from the stored parameters; reported, never applied. */
export const DERIVED_KEYS = [
  "shadow-2xs",
  "shadow-xs",
  "shadow-sm",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
  "tracking-normal",
] as const;

const COLOR_KEYS = new Set<string>([
  ...SEMANTIC_COLOR_KEYS,
  ...CHART_KEYS,
  ...SIDEBAR_KEYS,
  "shadow-color",
]);

const THEME_AUTHORITY_KEYS = new Set<string>([
  "font-sans",
  "font-serif",
  "font-mono",
  "radius",
]);

const TEXT_KEYS = new Set<string>([...FONT_KEYS, "letter-spacing", "spacing"]);

const SHADOW_LENGTH_KEYS = new Set<string>([
  "shadow-blur",
  "shadow-spread",
  "shadow-offset-x",
  "shadow-offset-y",
]);

function normaliseOklch(value: string): string | null {
  const match = value
    .trim()
    .match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!match) return null;
  const L = Number(parseFloat(match[1]).toFixed(3));
  const C = Number(parseFloat(match[2]).toFixed(3));
  const H = C === 0 ? 0 : Number(parseFloat(match[3]).toFixed(1));
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

function hexToOklchString(hex: string): string | null {
  let v = hex.replace("#", "");
  if (v.length === 3) v = v.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return null;
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lr = lin(r);
  const lg = lin(g);
  const lb = lin(b);
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l = Math.cbrt(l_);
  const m = Math.cbrt(m_);
  const s = Math.cbrt(s_);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b_ = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(a * a + b_ * b_);
  const H = ((Math.atan2(b_, a) * 180) / Math.PI + 360) % 360;
  const L3 = Number(L.toFixed(3));
  const C3 = Number(C.toFixed(3));
  const H1 = C3 === 0 ? 0 : Number(H.toFixed(1));
  return `oklch(${L3.toFixed(3)} ${C3.toFixed(3)} ${H1.toFixed(1)})`;
}

function normaliseColor(key: string, value: string): string | null {
  if (typeof value !== "string") return null;
  if (value.startsWith("#")) return hexToOklchString(value);
  if (value.startsWith("oklch(")) return normaliseOklch(value);
  return null;
}
export { normaliseColor };

export const MAX_PAYLOAD_BYTES = 256 * 1024;

/**
 * Parse a fetched body with a hard size cap. Returns ok:true only when the
 * body is within the cap and valid JSON.
 */
export function parsePayloadText(
  text: string
): { ok: true; value: unknown } | { ok: false } {
  if (text.length > MAX_PAYLOAD_BYTES) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

const LINK_HOST = "(?:https://)?(?:www\\.)?tweakcn\\.com";

/** Extract a theme id from one of the two accepted link shapes, or null. */
export function parseThemeLink(url: string): string | null {
  const trimmed = url.trim();
  const page = trimmed.match(
    new RegExp(`^${LINK_HOST}/themes/([A-Za-z0-9_-]+)/?$`)
  );
  if (page) return page[1];
  const endpoint = trimmed.match(
    new RegExp(`^${LINK_HOST}/r/themes/([A-Za-z0-9_-]+)\\.json$`)
  );
  if (endpoint) return endpoint[1];
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function normaliseLength(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}rem`;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^-?\d+(\.\d+)?(rem|px|em)?$/.test(trimmed)) {
      return `${parseFloat(trimmed)}rem`;
    }
  }
  return null;
}

export type ImportOutcome =
  | { ok: true; theme: string; cssVars: CssVars; ignored: string[] }
  | { ok: false; error: string };

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export function importTheme(input: unknown): ImportOutcome {
  const item = toRecord(input);

  // Three accepted shapes: registry item with cssVars, a bare cssVars object,
  // or a bare { light, dark } pair.
  const cssVars = "cssVars" in item ? toRecord(item.cssVars) : item;
  const theme = toRecord(cssVars.theme);
  const light = toRecord(cssVars.light);
  const dark = "dark" in cssVars ? toRecord(cssVars.dark) : light;

  if (Object.keys(light).length === 0) {
    return { ok: false, error: "A theme needs a light block." };
  }

  const ignored = new Set<string>();

  // Report the css block and every key outside the 44-key whitelist.
  if ("css" in item && item.css != null) ignored.add("css");
  for (const group of [theme, light, dark]) {
    for (const key of Object.keys(group)) {
      if (!(PARAMETER_KEYS as readonly string[]).includes(key)) {
        ignored.add(key);
      }
    }
  }

  const lightOut: Record<string, string> = {};
  const darkOut: Record<string, string> = {};
  const missing: string[] = [];

  for (const key of PARAMETER_KEYS) {
    const themeWins = THEME_AUTHORITY_KEYS.has(key);

    // Resolve the authoritative light value. For fonts and radius the theme
    // group wins; for everything else the light group wins.
    let lightValue: unknown;
    if (themeWins) {
      lightValue = key in theme ? theme[key] : light[key];
      if (key in theme && key in light) ignored.add(key);
    } else {
      lightValue = light[key];
    }

    // letter-spacing source order: light's letter-spacing, then light's
    // tracking-normal, then theme's tracking-normal, then a 0em default.
    // The value passes through unchanged (already em or calc()).
    if (key === "letter-spacing") {
      if (lightValue === undefined || lightValue === null) {
        lightValue = light["tracking-normal"];
      }
      if (lightValue === undefined || lightValue === null) {
        lightValue = theme["tracking-normal"];
      }
      if (lightValue === undefined || lightValue === null) {
        lightValue = "0em";
      }
    }

    // Colours are mode specific; every other parameter is unified across modes.
    const darkValue = COLOR_KEYS.has(key)
      ? key in dark
        ? dark[key]
        : lightValue
      : lightValue;

    if (lightValue === undefined || lightValue === null) {
      missing.push(key);
      continue;
    }

    if (COLOR_KEYS.has(key)) {
      const nl =
        typeof lightValue === "string" ? normaliseColor(key, lightValue) : null;
      const nd =
        typeof darkValue === "string" ? normaliseColor(key, darkValue) : null;
      if (nl === null || nd === null) {
        return {
          ok: false,
          error: `\`${key}\` is not a colour this editor understands.`,
        };
      }
      lightOut[key] = nl;
      darkOut[key] = nd;
    } else if (key === "radius") {
      const value = normaliseLength(lightValue);
      if (value === null) {
        return {
          ok: false,
          error: "`radius` is not a length this editor understands.",
        };
      }
      lightOut[key] = value;
      darkOut[key] = value;
    } else if (key === "shadow-opacity") {
      const value = toNumber(lightValue);
      if (value === null) {
        return {
          ok: false,
          error: `\`${key}\` is not a number this editor understands.`,
        };
      }
      lightOut[key] = `${value}`;
      darkOut[key] = `${value}`;
    } else if (SHADOW_LENGTH_KEYS.has(key)) {
      const value = toNumber(lightValue);
      if (value === null) {
        return {
          ok: false,
          error: `\`${key}\` is not a number this editor understands.`,
        };
      }
      const formatted = value !== 0 ? `${value}px` : "0";
      lightOut[key] = formatted;
      darkOut[key] = formatted;
    } else if (TEXT_KEYS.has(key)) {
      if (typeof lightValue !== "string") {
        return {
          ok: false,
          error: `\`${key}\` is not a string this editor understands.`,
        };
      }
      lightOut[key] = lightValue;
      darkOut[key] = lightValue;
    } else {
      const value = typeof lightValue === "string" ? lightValue : String(lightValue);
      lightOut[key] = value;
      darkOut[key] = value;
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      error: `This theme is missing keys: ${missing
        .map((k) => `--${k}`)
        .join(", ")}.`,
    };
  }

  return {
    ok: true,
    theme: typeof item.name === "string" ? item.name : "zinc",
    cssVars: {
      light: lightOut as unknown as CssVars["light"],
      dark: darkOut as unknown as CssVars["dark"],
    },
    ignored: Array.from(ignored),
  };
}
