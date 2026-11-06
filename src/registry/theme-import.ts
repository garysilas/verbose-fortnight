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

function normaliseLength(value: string, fallback: string): string {
  const n = parseFloat(value);
  if (Number.isFinite(n)) return `${n}rem`;
  if (/^-?[\d.]+(rem|px|em)$/.test(value.trim())) {
    return `${parseFloat(value)}rem`;
  }
  return fallback;
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

  for (const key of PARAMETER_KEYS) {
    // Authority: theme wins for fonts and radius; light wins for the rest.
    const sourceValue =
      THEME_AUTHORITY_KEYS.has(key) && key in theme
        ? theme[key]
        : key in light
          ? light[key]
          : dark[key];

    const lightValue =
      key in light ? (light[key] as string) : (sourceValue as string);
    const darkValue =
      key in dark ? (dark[key] as string) : (lightValue as string);

    if (COLOR_KEYS.has(key)) {
      const nl = normaliseColor(key, lightValue);
      const nd = normaliseColor(key, darkValue);
      if (nl === null || nd === null) {
        return {
          ok: false,
          error: `\`${key}\` is not a colour this editor understands.`,
        };
      }
      lightOut[key] = nl;
      darkOut[key] = nd;
    } else if (key === "radius") {
      lightOut[key] = normaliseLength(lightValue, "0.5rem");
      darkOut[key] = normaliseLength(darkValue, lightOut[key]);
    } else if (key === "shadow-opacity") {
      lightOut[key] = `${parseFloat(lightValue) || 0}`;
      darkOut[key] = `${parseFloat(darkValue) || 0}`;
    } else if (
      key === "shadow-blur" ||
      key === "shadow-spread" ||
      key === "shadow-offset-x" ||
      key === "shadow-offset-y"
    ) {
      const nl = parseFloat(lightValue);
      const nd = parseFloat(darkValue);
      const fmt = (n: number) => (Number.isFinite(n) && n !== 0 ? `${n}px` : "0");
      lightOut[key] = fmt(nl);
      darkOut[key] = fmt(nd);
    } else {
      lightOut[key] = lightValue;
      darkOut[key] = darkValue;
    }
  }

  // Unify the non-colour, non-mode keys across both modes (fonts, shadows,
  // tracking, spacing) so the two modes cannot diverge after import.
  for (const key of [...FONT_KEYS, ...SHADOW_KEYS, "letter-spacing", "spacing"]) {
    if (!COLOR_KEYS.has(key)) {
      darkOut[key] = lightOut[key];
    }
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
