#!/usr/bin/env node
// One-time conversion of HSL triplet tokens to complete oklch() values.
// Idempotent: already-converted oklch(...) values are not matched and are left alone.
// Refuses to write if any value fails to parse, or if any converted value does not
// round-trip back to its source hex within one 8-bit step per channel.
//
// Usage: node scripts/convert-themes.mjs [--check]

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Files are staged here and only flushed once every value has parsed and
// round-tripped, so a failure leaves the working tree untouched.
const pending = [];

const ROOT = resolve(new URL(".", import.meta.url).pathname, "..");

// ---------- color math ----------

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function hslToRgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  s /= 100;
  l /= 100;
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}

function rgbToOklch(r, g, b) {
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

function oklchToRgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b_ = C * Math.sin(hr);
  const l = L + 0.3963377774 * a + 0.2158037573 * b_;
  const m = L - 0.1055613458 * a - 0.0638541728 * b_;
  const s = L - 0.0894841775 * a - 1.291485548 * b_;
  const lr = 4.0767416621 * l ** 3 - 3.3077115913 * m ** 3 + 0.2309699292 * s ** 3;
  const lg = -1.2684380046 * l ** 3 + 2.6097574011 * m ** 3 - 0.3413193965 * s ** 3;
  const lb = -0.0041960863 * l ** 3 - 0.7034186147 * m ** 3 + 1.707614701 * s ** 3;
  const clamp = (c) => Math.min(1, Math.max(0, c));
  return [clamp(linearToSrgb(lr)), clamp(linearToSrgb(lg)), clamp(linearToSrgb(lb))];
}

function rgbToHex(r, g, b) {
  const c = (v) =>
    Math.round(Math.min(255, Math.max(0, v * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function formatOklch({ L, C, H }) {
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

function tripletToOklch(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l);
  const sourceHex = rgbToHex(r, g, b);
  const { L, C, H: rawH } = rgbToOklch(r, g, b);
  const L3 = +L.toFixed(3);
  const C3 = +C.toFixed(3);
  // A chroma that rounds to zero carries no meaningful hue; normalise to 0
  // so greys read as oklch(L 0 0) instead of a spurious hue from float noise.
  const H1 = C3 === 0 ? 0 : +rawH.toFixed(1);
  const str = formatOklch({ L: L3, C: C3, H: H1 });
  const [r2, g2, b2] = oklchToRgb(L3, C3, H1);
  const roundHex = rgbToHex(r2, g2, b2);
  const src = hexToRgb(sourceHex);
  const rt = hexToRgb(roundHex);
  const drift = Math.max(
    Math.abs(src[0] - rt[0]),
    Math.abs(src[1] - rt[1]),
    Math.abs(src[2] - rt[2])
  );
  if (drift > 1) {
    throw new Error(
      `round-trip drift ${sourceHex} -> ${str} -> ${roundHex} (max ${drift})`
    );
  }
  return str;
}

// ---------- apply ----------

const results = [];
const problems = [];

function convertThemes() {
  const p = resolve(ROOT, "src/registry/themes.ts");
  let src = readFileSync(p, "utf8");
  let out = src;
  const re = /"(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%?"/g;
  out = out.replace(re, (full, h, s, l) => {
    try {
      const oklch = tripletToOklch(parseFloat(h), parseFloat(s), parseFloat(l));
      results.push(`themes.ts ${full} -> ${oklch}`);
      return `"${oklch}"`;
    } catch (e) {
      problems.push(`themes.ts ${full}: ${e.message}`);
      return full;
    }
  });
  if (out !== src) pending.push([p, out]);
}

function convertGlobals() {
  const p = resolve(ROOT, "src/app/globals.css");
  let src = readFileSync(p, "utf8");
  let out = src;
  // plain triplet: --token: H S% L%;
  out = out.replace(
    /(--[a-z-]+:\s*)(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%;/g,
    (full, prefix, h, s, l) => {
      try {
        const oklch = tripletToOklch(parseFloat(h), parseFloat(s), parseFloat(l));
        results.push(`globals.css ${prefix.trim()} ${h} ${s}% ${l}% -> ${oklch}`);
        return `${prefix}${oklch};`;
      } catch (e) {
        problems.push(`globals.css ${prefix.trim()}: ${e.message}`);
        return full;
      }
    }
  );
  // wrapped hsl(): --token: hsl(H, S%, L);
  out = out.replace(
    /(--[a-z-]+:\s*)hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%?\);/g,
    (full, prefix, h, s, l) => {
      try {
        const oklch = tripletToOklch(parseFloat(h), parseFloat(s), parseFloat(l));
        results.push(`globals.css ${prefix.trim()} hsl(${h},${s}%,${l}) -> ${oklch}`);
        return `${prefix}${oklch};`;
      } catch (e) {
        problems.push(`globals.css ${prefix.trim()}: ${e.message}`);
        return full;
      }
    }
  );
  if (out !== src) pending.push([p, out]);
}

function write(p, content) {
  if (process.argv.includes("--check")) return;
  writeFileSync(p, content);
}

convertThemes();
convertGlobals();

console.log(`Converted ${results.length} value(s).`);
if (results.length > 0) {
  console.log("Sample conversions:");
  for (const r of results.slice(0, 12)) console.log("  " + r);
}
if (problems.length > 0) {
  console.error("FAILED to convert or round-trip the following values:");
  for (const p of problems) console.error("  " + p);
  console.error("Nothing was written.");
  process.exit(1);
}

for (const [p, content] of pending) write(p, content);
if (process.argv.includes("--check")) {
  console.log("(dry run: no files written)");
}
