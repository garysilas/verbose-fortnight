# Scope: shadcn/ui Customizer

A live theme editor for shadcn/ui components: choose semantic colours, radius and style, watch the specimen update, copy the CSS. This pass moves the app to Tailwind 4 and adds tweakcn styling parameters with preset import and export.

**Build approach:** Tracer Bullet (each slice ends with a running app that renders and exports a working theme).
**Workflow:** Beta (check verify, then test). Project default; a feature tag overrides it.

_You are in charge. Every box is a suggestion: run any, skip any, mark a feature done when you decide it is. The workflow records what you did; it only asks that a load bearing decision be written down._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Theme customizer app | Existing | existing |
| B | Component and block registry | Existing | existing |
| 1 | Tailwind v4 toolchain | Foundation | done |
| 2 | Check harness for the theme engine | Foundation | done |
| 3 | v4 class conformance | Slice 1 | done |
| 4 | oklch tokens and one export generator | Slice 2 | done |
| 5 | tweakcn parameter set and editor | Slice 3 | done |
| 6 | tweakcn preset interop | Slice 4 | done |

## Existing

### A. Theme customizer app · existing
Twelve preset themes, semantic colour editing, radius, style, mode, live preview and one copy action, on an HSL triplet model with two export paths. code in `src/components/theme-customizer.tsx`, `src/registry/themes.ts`, `src/hooks/use-config.ts`

### B. Component and block registry · existing
Forty seven UI components in two styles, with examples and blocks, mirrored into a generated index and three preview routes. code in `src/registry/`, `src/__registry__/`, `src/app/`

## Foundation

### 1. Tailwind v4 toolchain · done
npm with `package-lock.json` as the one manager, `@tailwindcss/postcss`, `tw-animate-css`, no config file and a v4 `globals.css`, so the app boots on v4.
**Done when:** install and build succeed on v4 with npm, `bun.lockb` and `tailwind.config.js` are gone, `components.json` names the real CSS file, `mdx.css` compiles its twelve `@apply` rules, and home, blocks and the open editor render at 390 and 1440.
- [x] Design it (spec): `/architect tailwind v4 toolchain`
- [x] Build it: `/develop tailwind v4 toolchain`
   - [x] Toolchain, versions and lockfile: npm, PostCSS plugin, config removal (AC-1 to AC-3)
   - [x] Stylesheet: v4 entry, `@theme inline` mapping, `@reference` in `mdx.css` (AC-4 to AC-7)
   - [x] Route check: `components.json`, build, three routes at 390 and 1440 (AC-8 to AC-10)
- [x] Verify it: `/check verify tailwind v4 toolchain` (verified manually by the coordinator: bare build, dependency set, four renders)
- [x] Test it: `/test tailwind v4 toolchain` (skipped, there is no runner until slice 0002)
Spec [0001](../specs/0001-tailwind-v4-toolchain.md)

### 2. Check harness for the theme engine · done
There is no test script and no runner, so the export rewrite has nothing to be measured against; add the runner and pin today's output first.
**Done when:** `npm test` runs headless, one fixture pins the current export as a known baseline, and a deliberately wrong token fails the run.
- [x] Design it (spec): `/architect check harness for the theme engine`
- [x] Build it: `/develop check harness for the theme engine`
   - [x] Runner, `test` script and `@/` alias config (AC-1, AC-2)
   - [x] Move `getThemeCode` into `src/registry/theme-export.ts` unchanged (AC-3, AC-8)
   - [x] Zinc fixture, radius defect case, mutation check (AC-4 to AC-7)
- [x] Verify it: `/check verify check harness for the theme engine` (verified manually by the coordinator: extraction unchanged, fixture committed, build still 30 pages)
- [x] Test it: `/test check harness for the theme engine` (real pass: `npm test` runs 1 file, 2 tests, both green)
Spec [0002](../specs/0002-theme-engine-check-harness.md)

## Slice 1

### 3. v4 class conformance · done
Bring every vendored component, example, block and generated source string onto v4 class meaning, so the specimen stops drifting from the CSS being exported.
**Done when:** no v3 only utility remains in `src/registry`, `src/components/ui` or `src/__registry__`, and each converted component renders correctly on v4 defaults (3px rings, shifted rounded, shadow and blur scales), with no v3 scale overrides kept for look parity.
- [x] Design it (spec): `/architect v4 class conformance`
- [x] Build it: `/develop v4 class conformance`
   - [x] `tailwind-merge` 3.7.0 and the merge test (AC-5)
   - [x] Meaning renames across components, both styles, examples, blocks and routes (AC-1 to AC-3, AC-7)
   - [x] Scans, mirrored registry files, build and focus pass (AC-4, AC-6, AC-8); `src/__registry__/index.tsx` needed no edit because it carries none of the affected classes
- [x] Verify it: `/check verify v4 class conformance` (verified manually by the coordinator: scans return 0 remaining with 154, 5 and 3 new names present, build 30 pages)
- [x] Test it: `/test v4 class conformance` (real pass: `npm test` 4 tests green)
Spec [0003](../specs/0003-v4-class-conformance.md)

## Slice 2

### 4. oklch tokens and one export generator · done · GA
Store every token as a complete oklch colour and emit one v4 export, replacing the duplicated `getThemeCode` template and the `CustomizerCode` JSX re-emitter.
**Done when:** presets, pickers and preview agree on oklch, the dialog and the header copy produce byte identical v4 CSS, the v3 HSL export is gone, and the radius unit defect is fixed.
- [x] Design it (spec): `/architect oklch tokens and one export generator`
- [x] Build it: `/develop oklch tokens and one export generator`
   - [x] Convert the twelve presets and the default tokens with the committed script (AC-1 to AC-4); re-running `node scripts/convert-themes.mjs --check` reports 0 converted
   - [x] Hex and oklch helpers, preview wrapper with no wrapper or unit (AC-3, AC-9)
   - [x] One generator, both copy paths, dialog renders the copied string (AC-5 to AC-7)
   - [x] `globals.css` from the generator, storage key `config-v2`, fixtures, drift test (AC-8, AC-10)
- [x] Verify it: `/check verify oklch tokens and one export generator` (verified manually by the coordinator: build 30 pages, `/`, `/blocks` and `/blocks/default/dashboard-05` all 200, copy dialog read in the browser, no `remrem`)
- [x] Test it: `/test oklch tokens and one export generator` (real pass: `npm test` 5 tests across 3 files green)
- [x] Review it (fresh model): `/check review oklch tokens and one export generator` (verdict: ship with fixes, report at `docs/reviews/0004-oklch-review.md`; the medium converter finding is fixed, two low findings are queued)
- [x] Document it: `/document oklch tokens and one export generator` (changelog entry in `CHANGELOG.md`)
Spec [0004](../specs/0004-oklch-tokens-single-export-generator.md)

## Slice 3

### 5. tweakcn parameter set and editor · done
Add the parameters tweakcn defines and this app lacks (chart one to five, the sidebar set, three fonts, six shadow values, letter spacing, spacing), with a control and a live binding for each.
**Done when:** every parameter has a control showing its value, each one changes the preview it claims to change, and no control writes a variable the preview ignores.
- [x] Design it (spec): `/architect tweakcn parameter set and editor`
- [x] Build it: `/develop tweakcn parameter set and editor` (the AC-13 guard is built: `src/registry/theme-export.ts` throws at lines 85, 88 and 92 for a missing light token, dark token and radius; `src/registry/colors.ts` is deleted. The AC-13 test is the one gap.)
   - [x] Model, defaults and merge for all 44 parameters (AC-1)
   - [x] Derivations, generator and `globals.css` tokens and theme mappings (AC-4, AC-5, AC-10)
   - [x] Specimens and binding for chart, sidebar, fonts, shadows, tracking, spacing (AC-3, AC-6, AC-7, AC-11, AC-12)
   - [x] Controls with values, bounds, panel order, tests (AC-2, AC-8, AC-9)
- [x] Verify it: `/check verify tweakcn parameter set and editor` (verified manually by the coordinator: build 30 pages, three routes 200, six parameter groups render, the chart specimen is a real `ChartContainer`, no `@base-ui/react` or `tailwind-variants` in the manifest)
- [x] Test it: `/test tweakcn parameter set and editor` (13 tests across 3 files green, including `test/theme-export.test.ts:88`, which deletes `sidebar-border` and asserts the missing light token throw, so AC-13 is proven)
Spec [0005](../specs/0005-tweakcn-parameter-binding.md)

## Slice 4

### 6. tweakcn preset interop · done
Import and export tweakcn registry JSON and share links, so a theme round trips into this editor and back out unchanged.
**Done when:** an imported tweakcn preset re-exported matches the source for every supported parameter, a share link loads, and an invalid or unsupported preset fails loudly instead of dropping values.
- [x] Design it (spec): `/architect tweakcn preset interop`
- [x] Build it: `/develop tweakcn preset interop` (all seven review findings fixed)
   - [x] Confirm the share link shape and record the endpoint (AC-7, AC-8)
   - [x] Export the registry item (AC-1)
   - [x] Parser, normaliser and ignored key report (AC-2 to AC-5)
   - [x] Import dialog with confirm, server route with host guard, tests (AC-6, AC-7)
- [x] Verify it: `/check verify tweakcn preset interop` (verified manually by the coordinator: resolution order at `theme-import.ts:238-248` matches AC-14, authority proved by mutation, `MAX_PAYLOAD_BYTES` 256 KB rejected before parsing, host, path, id regex and redirect rule unchanged)
- [x] Test it: `/test tweakcn preset interop` (real pass: `npm test` 24 tests across 3 files green, including the four letter spacing branches, the two size cap cases and the theme-wins regression)
Spec [0006](../specs/0006-tweakcn-preset-interop.md)

## Deferred
- **Preset library**: browse built in tweakcn presets. Set aside by the user, and it is a UI shell over the import path in spec 0006 rather than a second fetcher.
- **Workbench redesign**: the preview first layout in `docs/design/DESIGN.md`. Direction only, not authorized this pass.
- **Next 16 and React 19**: held at 14.2 and 18.2 by decision.
- **Upstream registry sync**: tracking later shadcn releases, which would mean moving to the `radix-ui` and `tailwind-variants` family. Not authorized.
- **v3 HSL export**: dropped by decision, v4 output only.
- **Rate limiting on the themes route**: deferred on purpose. The app proxies a public JSON endpoint on a public demo and has no rate limiter anywhere else, so a token bucket on one route handler would be infrastructure without a home. Revisit if the app grows a shared limiter. The response size cap is not deferred; it is in the 0006 fix list.
- **Chart palette for built in presets**: the derived palette is degenerate on neutral themes, since zinc's near zero chroma cannot separate five hues. Author real palettes or take them from an imported tweakcn preset.
- **Chart type aliases**: `src/components/ui/chart.tsx` carries local type aliases that reconcile the registry chart written for recharts 3 with the pinned recharts 2.7.2. They are deliberate until the upgrade.
- **recharts 3 upgrade**: would let those local aliases go. Not authorized.

`needs a decision` means `/architect` first; the box labelled `(spec)` is that decision, every other box is execution. Status runs `planned` to `in-progress` to `done`, plus `existing` and `dropped`; at Beta a feature closes after `/check verify` then `/test`, and `· GA` adds `/check review` then `/document`.
