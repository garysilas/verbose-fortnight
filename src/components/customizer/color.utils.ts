// Colour conversion between hex (picker input/display) and oklch (stored).
// Rounding matches scripts/convert-themes.mjs: three decimals for lightness
// and chroma, one for hue, hue normalised to 0 when chroma rounds to zero.

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let value = hex.replace("#", "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = parseInt(value, 16);
  if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 };
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function rgbToOklch(r: number, g: number, b: number): {
  L: number;
  C: number;
  H: number;
} {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
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
  const H = (Math.atan2(b_, a) * 180) / Math.PI;
  return { L, C, H: (H + 360) % 360 };
}

function oklchToRgb(L: number, C: number, H: number): {
  r: number;
  g: number;
  b: number;
} {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b_ = C * Math.sin(hr);
  const l = L + 0.3963377774 * a + 0.2158037573 * b_;
  const m = L - 0.1055613458 * a - 0.0638541728 * b_;
  const s = L - 0.0894841775 * a - 1.291485548 * b_;
  const lr = 4.0767416621 * l ** 3 - 3.3077115913 * m ** 3 + 0.2309699292 * s ** 3;
  const lg = -1.2684380046 * l ** 3 + 2.6097574011 * m ** 3 - 0.3413193965 * s ** 3;
  const lb = -0.0041960863 * l ** 3 - 0.7034186147 * m ** 3 + 1.707614701 * s ** 3;
  const clamp = (c: number) => Math.min(1, Math.max(0, c));
  return {
    r: clamp(linearToSrgb(lr)),
    g: clamp(linearToSrgb(lg)),
    b: clamp(linearToSrgb(lb)),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function hexToOklch(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const { L, C, H } = rgbToOklch(r, g, b);
  const L3 = Number(L.toFixed(3));
  const C3 = Number(C.toFixed(3));
  const H1 = C3 === 0 ? 0 : Number(H.toFixed(1));
  return `oklch(${L3} ${C3} ${H1})`;
}

export function oklchToHex(oklch: string): string {
  const match = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) return "#000000";
  const { r, g, b } = oklchToRgb(
    parseFloat(match[1]),
    parseFloat(match[2]),
    parseFloat(match[3])
  );
  return rgbToHex(r, g, b);
}
