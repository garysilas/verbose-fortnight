# 0004 code review

**Verdict: ship with fixes.** One real contract miss in the converter script; the app data and the export path are correct.

## Findings

1. **Medium: `scripts/convert-themes.mjs` writes before it has validated every value** (`scripts/convert-themes.mjs:138`, `:173`, `:189-193`). `convertThemes()` and `convertGlobals()` each call `write(p, out)` at the end of their replace pass, then the shared `problems` check runs and prints "Nothing was written." A file with one unparsable triplet is therefore partially rewritten, and the process exits 1 having already changed it. AC-2 says the script "refuses to write if any value fails to parse". Fix: collect problems, and only call `write` after `problems.length === 0`.
   This has no effect on the shipped data: the conversion is complete and every value round-trips.

2. **Low: `buildThemeCss` has no guard for a missing token** (`src/registry/theme-export.ts:45-56`). A partial `cssVars.light`/`dark` produces `--token: undefined;`. Not reachable from the current UI (every preset has all 19 tokens, the default is complete, and the old key is not read), but it is a silent bad export rather than an error.

3. **Low: `src/registry/colors.ts` is dead code holding 244 HSL values** (1556 lines, no importer anywhere in `src`, `test` or `scripts`). It contradicts the "one colour representation" invariant and is a trap for a later reader. Delete or convert it.

## What checked out

- Conversion fidelity: independently converted old HSL and new oklch to hex for all 464 `cssVars` values plus 24 `activeColor` values; every channel within 1/255. The malformed slate dark ring `212.7 26.8% 83.9` and `oklch(0.869 0.020 252.8)` are both `#cbd5e1`. No token changed meaning.
- `npm test`: 5 passed. The fixture, no-`remrem`, and globals-vs-generator tests are real and pass.
- `node scripts/convert-themes.mjs --check`: "Converted 0 value(s)", exit 0, so it is idempotent.
- `buildThemeCss` is the only CSS-text producer; both copy buttons (`theme-customizer.tsx:199`, `:241`) call it, and `CustomizerCode` renders the same call (`:271`).
- `config-v2` is the only storage key read (`use-config.ts:18`); the old `config` key cannot load at all.
- No `lodash.template` in the manifest, lockfile or source. No `hsl(` or HSL helper left in `globals.css`, `themes.ts`, `theme-wrapper.tsx`, `theme-customizer.tsx`, `color.utils.ts`.
- Radius is a complete length everywhere; no code appends a unit to a stored value.
