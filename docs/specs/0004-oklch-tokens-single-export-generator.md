# 0004. Store oklch tokens and generate the v4 export once

**Date**: 2026-11-05
**Status**: Accepted

## Summary

The app stores each colour as an HSL triplet and wraps it in `hsl()` in three places, and it emits the exported CSS twice. This spec stores each token as a complete oklch colour, converts the twelve presets once, and replaces both export paths with one function that returns the v4 CSS string. The dialog then shows exactly the string that gets copied. It also fixes the doubled radius unit that makes presets export `0.5remrem`.

## Context

The current model is a string of three numbers with no function around it, so every consumer has to know whether to wrap it. `globals.css` declares `--background: 0 0% 100%`, the Tailwind config maps `hsl(var(--background))`, the preview wrapper injects `--background: 0 0% 100%`, and the colour picker writes the same triplet from `hexToHSL`. A stray wrapping mistake is therefore always one line away, and one already exists: the dark ring value is stored as `hsl(212.7, 26.8%, 83.9)` inside a triplet slot.

Tailwind 4 and tweakcn both express colours as complete `oklch()` values, which removes the question. A complete value is valid wherever a colour is expected: in a custom property, in an inline style, and in `@theme inline` without a wrapper. It also carries lightness and chroma in a perceptual space, which is what the pickers and the preset swatches actually want.

The export is worse than the storage. `getThemeCode` renders a lodash template, and `CustomizerCode` re-emits the same CSS as hand written JSX spans. They agree today by luck. Every change to the export has to be made twice, and the dialog can show something the copy button does not produce. Spec 0002 already moved the template into a module and pinned its output, so the rewrite has a net.

Radius has its own version of the same problem: presets store `"0.5rem"`, the radius control stores `0.5`, and both `ThemeWrapper` and the template append `rem`, so a preset export reads `--radius: 0.5remrem`.

## Requirements

**User stories**:
- As a user, I want the copied CSS to be exactly what the dialog shows, in the form Tailwind 4 expects.
- As the engineer, I want one place that produces CSS so that a change cannot land in one path and miss the other.

**Acceptance criteria**:
- **AC-1**: every colour token in `src/registry/themes.ts` and in the `:root` and `.dark` blocks of `src/app/globals.css` is a complete `oklch(L C H)` value; no HSL triplet and no `hsl()` wrapper remains in `globals.css`, `themes.ts`, `theme-wrapper.tsx`, `theme-customizer.tsx` or `color.utils.ts`.
- **AC-2**: `scripts/convert-themes.mjs` performs the conversion once, refuses to write if any value fails to parse, and is idempotent; every converted value maps back to its source hex within one 8 bit step per channel.
- **AC-3**: `--radius` is a complete length everywhere. The presets store `"0.5rem"`, the radius control writes `"0.5rem"`, and neither the preview nor the export appends a unit; a test asserts no output contains `remrem`.
- **AC-4**: the dark `--ring` value is a valid colour and the zinc light `--popover` value no longer carries a trailing semicolon.
- **AC-5**: `buildThemeCss(config)` in `src/registry/theme-export.ts` is the only code that produces CSS text; the lodash template and the JSX copy in `CustomizerCode` are deleted, and `lodash.template` leaves the manifest.
- **AC-6**: the header copy action and the dialog copy action pass the same string, and the dialog renders that string character for character.
- **AC-7**: the exported string contains the two imports, the dark custom variant, a `:root` block, a `.dark` block and an `@theme inline` block mapping colours and the radius scale; it contains no `@layer base` and no `hsl()`.
- **AC-8**: the `:root` and `.dark` token lines in `src/app/globals.css` equal the generator's output for the default preset, compared by a test, so the static file and the generator cannot drift.
- **AC-9**: the pickers still take hex input, convert hex to oklch for storage, and derive the displayed hex back from the stored value; no HSL helper remains.
- **AC-10**: the stored config moves to a new key, so a config saved before this change is ignored and the default preset loads instead of injecting triplets.

## Options considered

### Option 1: Store complete oklch, convert at the pickers

The stored value is the value used everywhere. Picker conversion happens only at the input edge.

**Pros**:
- One representation, no consumer needs to know how to wrap it.
- Matches what the export and tweakcn expect, so spec 0006 has no format translation.

**Cons**:
- The twelve presets need a one time conversion, and every value changes in git.
- `oklchToHex` needs gamut handling for display.

### Option 2: Keep HSL triplets, convert to oklch at export

Leave storage alone and translate on the way out.

**Pros**:
- Smallest possible diff to the preset data.

**Cons**:
- The preview and the export use different colour spaces, so the swatch and the output can disagree at the gamut edge.
- The picker, the preview and the exporter each need a converter, which is the current problem with one more step.

### Option 3: Store hex, derive everything

Treat hex as the source of truth and compute oklch, HSL and swatches from it.

**Pros**:
- Human readable values, and every other form is derived.

**Cons**:
- `oklch(0.205 0 0)` does not round trip through hex without drift, so re-importing an exported theme changes it.
- tweakcn values outside the sRGB gamut cannot be stored at all.

## Decision

**Chosen option**: Option 1: Store complete oklch, convert at the pickers.

Store `oklch()` strings as the only colour representation, convert the twelve presets once with a committed script, and replace both export paths with `buildThemeCss(config)`, which returns the complete v4 CSS. The dialog renders that string in a plain monospaced block, so display and copy cannot diverge. The default preset is zinc, so `globals.css` carries the zinc tokens for both modes and the drift test compares against them.

**Implementation skills**: none installed for colour spaces, Tailwind or tweakcn in this project.

## Rationale

Option 1 is chosen because two later slices inherit the model. Spec 0005 adds parameters whose values come from tweakcn as oklch, and spec 0006 round trips them. Under option 2 every import and export needs a conversion with a rounding decision, and the round trip test would be measuring the converter rather than the model. Option 3 fails the round trip requirement outright for any value outside sRGB, which is common in tweakcn presets.

The display decision follows the same logic: a second renderer is how the two paths drifted in the first place. A plain block loses syntax colouring, which is a cosmetic loss recorded as a follow-up, and buys the guarantee the slice is about.

## Feature design

**Token model**:

| Field | Before | After |
|---|---|---|
| colour tokens | `"240 5.9% 10%"` | `"oklch(0.21 0.006 285.9)"` |
| `radius` | `"0.5rem"` in presets, `0.5` from the control | always `"0.5rem"` |
| `activeColor` | HSL triplet | `oklch()` string |
| storage key | `config` | `config-v2` |

**Generator API**:

| Export | Input | Output | Used by |
|---|---|---|---|
| `buildThemeCss(config)` | style, theme name, css variables for both modes | full v4 CSS string | dialog display, header copy, dialog copy |

**Export shape**:

```
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root { --<token>: oklch(...); ... --radius: 0.5rem; }
.dark { ... }

@theme inline {
  --color-<token>: var(--<token>);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

The import lines carry a comment saying they can be omitted when the target file already has them. Spec 0005 extends the `@theme inline` block and the token blocks with its parameters.

**Value sourcing**:

| Action | Value produced | Source |
|---|---|---|
| Dialog display | CSS text | `buildThemeCss(config)` |
| Header copy | CSS text | the same call |
| Swatch colour | hex string | `oklchToHex(stored token)` |
| Stored token | oklch string | `hexToOklch(input value)` |
| drift test expectation | token lines | `globals.css`, read and normalised |

**Invariants**:
- No code wraps a stored colour in a colour function.
- One generator, called by both copy actions, with no branch on where the call comes from.
- `globals.css` holds the default preset only; presets live in `themes.ts`.
- Rounding is fixed: three decimals for lightness and chroma, one for hue.

**Security model**: none. All values are client side theme data.

**Critical test scenarios**:
- Happy path: copy from the header and from the dialog, compare bytes, verifies **AC-6**.
- Drift: change one token in `globals.css` and the drift test fails, verifies **AC-8**.
- Defect: a preset export contains no `remrem`, verifies **AC-3**.
- Storage: reload with the old `config` key present and confirm the default preset renders, verifies **AC-10**.

## Build plan

1. Add `scripts/convert-themes.mjs` with hex, oklab and gamut helpers, run it over `themes.ts` and the default block, and commit the converted values, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**.
2. Replace the HSL helpers in `src/components/customizer/color.utils.ts` with `hexToOklch` and `oklchToHex`, satisfies **AC-9**.
3. Point the preview wrapper at the stored values with no unit or colour wrapper, satisfies **AC-1**, **AC-3**.
4. Write `buildThemeCss` in `src/registry/theme-export.ts` and delete the template and the JSX copy, satisfies **AC-5**, **AC-7**.
5. Point both copy actions and the dialog at the generator, satisfies **AC-6**.
6. Rewrite the `:root` and `.dark` blocks and the `@theme inline` mapping in `globals.css` from the generated output, satisfies **AC-1**, **AC-7**, **AC-8**.
7. Rename the storage key, update the fixtures from spec 0002, and run `npm test` plus the build, satisfies **AC-3**, **AC-8**, **AC-10**.

## Consequences

**Positive**:
- One colour representation and one export path, ready for the tweakcn work.
- The radius defect and the two malformed token values are fixed rather than carried forward.

**Negative / tradeoffs**:
- Every colour value changes in git, so the preset diff is large and cannot be reviewed line by line without the script.
- The dialog loses per token syntax colouring until a non mutating highlighter exists.
- Users with a saved theme lose it when the storage key changes. The user confirmed the drop over a runtime converter, so no migration path is added.

**Neutral**:
- `lodash.template` and its types leave the manifest.
- `oklchToHex` adds gamut clipping for display only; exported values are never clipped.
- The default preset is zinc, not the slate values that used to sit in `globals.css`, so the page chrome moves from a blue grey tint to a neutral one. The change is intended and the drift test enforces it.

## Migration plan

**Strategy**: big bang for code and data, with a storage key change in place of a runtime converter.
**Phases**:
1. Convert presets and default tokens.
2. Swap helpers, preview and generator.
3. Update fixtures, rename the storage key, build and verify.
**Rollback**: revert the commit. Saved themes under the old key were never deleted, so the previous build finds them again.
**Risks**: a conversion mistake in one preset, caught by the round trip test, and a gamut edge where the swatch differs from the token, caught by the picker check.

## Review outcome

Review by Verity on 2026-11-05. Verdict: ship with fixes. Report at `docs/reviews/0004-oklch-review.md`.

- **Medium, fixed by the coordinator.** `scripts/convert-themes.mjs` wrote each file before the shared problems check ran, so one unparsable triplet could leave a partially converted file while the script printed that nothing was written. Writes are now staged and flushed only when no problems are found. Proven in a throwaway copy rather than on the real files: a forced throw exits 1 with zero oklch written and the inputs byte identical, a clean copy converts 517 values and writes, and the real repo still reports "Converted 0" under `--check`. AC-2 now holds by construction, not by the script's log line.
- **Low, assigned to 0005.** `buildThemeCss` can emit `--token: undefined;` for a partial config. The slice that extends the same generator adds the guard.
- **Low, assigned to Forge.** `src/registry/colors.ts` is dead code holding 244 HSL values with no importer; delete it with a green build and test run.
- **Confirmed sound.** All 464 `cssVars` and 24 `activeColor` values round trip within 1/255 of the original hex; `buildThemeCss` is the only CSS producer at all three call sites; `config-v2` is the only storage key read; no `lodash.template` remains; no HSL helper or wrapper is left.

## Follow-up

- [ ] Add syntax colouring to the dialog with a highlighter that does not alter the copied string.
- [ ] Consider generating `globals.css` at build time instead of the drift test, if the default theme starts changing often.
- [ ] `scripts/convert-themes.mjs` is a one time tool; keep it for audit or delete it once the conversion is reviewed.
