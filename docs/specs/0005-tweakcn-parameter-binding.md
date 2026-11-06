# 0005. Add the tweakcn parameter set and bind each to the preview

**Date**: 2026-11-05
**Status**: Accepted

## Summary

This spec adds the parameters tweakcn defines and this app lacks: five chart colours, the eight sidebar colours, three font stacks, six shadow values, letter spacing and spacing. Every parameter gets a control that shows its value and a specimen in the preview that visibly changes, so no control can be moved without effect. The twelve existing presets keep working through documented derivations instead of new hand authored data.

## Context

The app models 19 colour tokens plus radius. tweakcn models 32 colour tokens plus radius, three fonts, six shadow values, letter spacing and spacing, and it is the format the user wants to import and export. A parameter that exists in the export but has no effect in the preview is worse than a missing parameter, because it tells the user they changed something when they did not. The scope's acceptance criterion for this slice is exactly that: no control writes a variable the preview ignores.

The preview surface decides the work. A chart component exists in the registry: `chart` is `registry:ui`, its only dependency is `recharts`, already in this repo at 2.7.2, and it defines `--chart-1` to `--chart-5`, so the specimen can be the real component instead of five hand built bars. A sidebar component exists too, but it depends on `@base-ui/react` and `tailwind-variants` and pulls in six sibling components and a hook, which is a second primitive family beside this repo's `@radix-ui/react-*` and cva. The existing chart examples paint their series with `fill-primary` and `stroke-primary`, not hardcoded colours, so repointing those series at `fill-chart-1` to `fill-chart-5` makes the block previews, the surface users actually look at, respond as well. That is 26 occurrences in six chart card files, twelve `fill-primary` and fourteen `stroke-primary`; the single `fill-primary` on the radio group check icon is not a chart series and stays. There is no sidebar component in this repo. Fonts and shadows are visible on any surface. Spacing is the one parameter with a blast radius: in Tailwind 4 the whole spacing scale is computed from `--spacing`, so overriding it changes every padding and gap inside the element that carries it.

`docs/design/DESIGN.md` holds two constraints that matter here. The workbench chrome and the specimen are distinct, so font parameters must change the specimen and not the editor. The export action stays single, so this slice adds controls to the existing panel and does not redesign the layout, which remains deferred.

## Requirements

**User stories**:
- As a user, I want to tune every parameter tweakcn supports and see the effect immediately, so that the exported theme is what I designed.
- As a user, I want to switch preset and get a complete, sensible theme rather than blank new fields.

**Acceptance criteria**:
- **AC-1**: the config model carries all 44 parameters, 32 colours plus radius in each mode, and fonts, shadows, tracking and spacing, and a stored config missing the new keys is filled from defaults on load rather than rendering empty values.
- **AC-2**: every parameter has a control that shows its current value as text, not only as a swatch, and the control writes exactly the token the export emits.
- **AC-3**: every new group changes something visible: the chart colours drive a chart specimen, which is the registry `chart` component when installed and five bars otherwise, and the recharts examples, and the sidebar set, the three fonts, the shadow set, letter spacing and spacing each have a specimen in the preview.
- **AC-4**: the generated CSS and the static `globals.css` both carry all 44 tokens, and `@theme inline` maps the new colours, fonts, derived shadows, tracking and spacing, so utilities such as `bg-chart-1` and `bg-sidebar` exist.
- **AC-5**: all twelve presets still load with no hand authored additions, chart colours derived by the documented hue rotation and sidebar colours derived from the documented mapping.
- **AC-6**: changing a font parameter changes the specimen text only; the editor chrome keeps its own font.
- **AC-7**: the spacing override applies inside the specimen wrapper only, and the editor chrome keeps its layout.
- **AC-8**: each numeric control enforces its bounds and rejects unparseable input without writing a token.
- **AC-9**: the panel keeps its existing structure and single export action; no layout redesign lands in this slice.
- **AC-10**: the drift test from spec 0004 covers the new tokens, so `globals.css` and the generator cannot diverge.
- **AC-11**: the chart specimen is the registry `chart` component, installed in the `base` style into `src/components/ui` with the token supplied from the environment and never from a URL, and its token names match `--chart-1` to `--chart-5`. If the install cannot be completed, the five bar specimen stands in and the reason is recorded.
- **AC-12**: the sidebar set stays parameter first. No `@base-ui/react`, `tailwind-variants` or registry sidebar component enters the tree in this slice, and the hand built panel binds the eight sidebar tokens.
- **AC-13**: `buildThemeCss` never emits `undefined` for a missing token. Given a partial config it either omits the token or fails with a readable error, and a test covers a config missing one new token, closing review finding 2 on 0004.

## Options considered

### Option 1: Model every parameter and bind each to a specimen

Add small specimens for charts, sidebar, fonts and shadows, and apply spacing and tracking inside the wrapper.

**Pros**:
- Every control can be trusted, which is the scope's stated bar.
- The chart binding can use the real registry component, and no new npm dependency is needed because `recharts` is already present.

**Cons**:
- More preview surface to build and keep in the panel order.
- The sidebar cannot use its registry component without a second dependency family, so that specimen stays hand built.

### Option 2: Model every parameter, bind what exists, label the rest

Export everything and mark unbound parameters "exported, not previewed".

**Pros**:
- Smaller slice, and honest for anything that cannot be shown.

**Cons**:
- Most of the new set is unbound, because the repo has no chart or sidebar component.
- A labelled but inert control is still inert; the user asked for parameters they can design with.

### Option 3: Model only what the preview can show

Drop chart, sidebar and shadows from the model.

**Pros**:
- Smallest and fully honest.

**Cons**:
- Fails the user's request for the tweakcn parameter set.
- Spec 0006 cannot round trip a real tweakcn preset.

## Decision

**Chosen option**: Option 1: Model every parameter and bind each to a specimen.

Add the full parameter set and bind it, using the registry `chart` component as the chart specimen and hand built panels for sidebar, fonts and shadows, plus derived preset values and a documented shadow token derivation. Keep the "exported, not previewed" label in the design as the rule for any parameter added later that cannot be bound.

**Implementation skills**: none installed for tweakcn or shadcn in this project.

## Rationale

Option 2 is the safe looking path and the one that quietly fails the slice's purpose. The repo lacks a chart and a sidebar component, but it does not lack a way to show five colours or a small surface with a foreground, an accent and a border; that is a handful of divs, not a dependency. Option 3 fails the user's request and blocks the interop slice, which needs the full field set to round trip.

The derived values keep the twelve presets out of the loop. Authoring 13 new values for 12 presets would be 156 values nobody asked for, and the derivation is explicit and reversible in the export.

## Feature design

**Parameter set**:

| Group | Parameters | Count |
|---|---|---|
| Semantic colours | the existing 19 | 19 |
| Data colours | `chart-1` to `chart-5` | 5 |
| Sidebar | `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | 8 |
| Radius | `radius` | 1 |
| Fonts | `font-sans`, `font-serif`, `font-mono` | 3 |
| Shadows | `shadow-color`, `shadow-opacity`, `shadow-blur`, `shadow-spread`, `shadow-offset-x`, `shadow-offset-y` | 6 |
| Rhythm | `letter-spacing`, `spacing` | 2 |

Fonts, shadows, tracking and spacing live inside both mode objects for export fidelity, and the editor writes both modes at once so they cannot diverge.

**Derived preset values**:

| Field | Rule |
|---|---|
| `chart-1` to `chart-5` | primary with its hue rotated by 0, 45, 90, 135 and 180 degrees, lightness and chroma unchanged |
| `sidebar` | `card`, with foreground, primary, accent, border and ring taken from their semantic namesakes |
| fonts | `font-sans` is the Inter stack already loaded in the layout, `font-serif` is the system serif stack, `font-mono` is the system mono stack |
| shadows | colour is `foreground`, opacity 0.1, blur 8px, spread 0, offset 0 and 4px |
| tracking, spacing | `0em`, `0.25rem` |

**Derived shadow tokens** (presentation only, never part of the tweakcn contract): the six parameters produce `--shadow-2xs` through `--shadow-2xl` with offsets and blur multiplied by 0.5, 0.75, 0.875, 1, 1.25, 1.75, 2.25 and 2.75, colour built with `color-mix` from `--shadow-color` and `--shadow-opacity`.

**Preview specimens**:

| Parameter group | Surface | Why it shows the change |
|---|---|---|
| chart | the registry `chart` component, falling back to five bars with `bg-chart-1` to `bg-chart-5` if the install cannot complete | each colour is visible side by side, and the component proves the binding on a real series |
| chart in the examples | the six chart card examples in both styles, with `fill-primary` and `stroke-primary` repointed to `fill-chart-1` to `fill-chart-5` | the blocks users copy show the data colours, not only the specimen |
| sidebar | a small panel with `bg-sidebar`, an active row, a muted row, a border and a ring | every sidebar token appears, and the panel avoids a second primitive family |
| fonts | three lines, `font-sans`, `font-serif`, `font-mono` | each stack is visible |
| shadows | one card at `shadow` and one at `shadow-lg` | blur, offset and opacity are visible |
| tracking | a paragraph at `tracking-normal` | spacing between letters changes |
| spacing | a stack of boxes at `p-4` and `gap-4` | the base unit change is visible |

**Registry component policy**:

| Item | Decision | Cost |
|---|---|---|
| chart | install `chart` (`registry:ui`, `base` style) into `src/components/ui` and use it as the specimen | no new npm dependency, `recharts` 2.7.2 is already present; its class usage still has to pass the 0003 scan |
| sidebar | do not install | the item needs `@base-ui/react` and `tailwind-variants` plus six sibling components and a hook, a second primitive family against the rename in place decision in 0003 |
| style | registry items install in the `base` style into `src/components/ui`, never into the two vendored style trees | keeps the preview and export sources untouched; the registry path carries the style, `/r/base/<item>.json` |

The install command is copied with its token removed and `SHADCNIO_TOKEN` supplies it. No registry URL in the repo carries a token.

**Value sourcing**:

| Action | Value produced | Source |
|---|---|---|
| Preset chart colour | `chart-N` | derived from the preset `primary` by the rotation rule |
| Chart specimen | rendered series | the registry `chart` component fed by the five stored chart tokens |
| Preset sidebar colour | 8 sidebar tokens | mapped from the preset semantic namesakes |
| Shadow token | `--shadow-*` | `buildShadowTokens()` from the six stored parameters |
| Control value | displayed text | the stored token, formatted per its type |
| Bounds | min and max | the bounds table in this spec |

**Invariants**:
- A control exists only if the export carries its token and a specimen shows it. A later parameter that cannot be shown gets the "exported, not previewed" label, never a silent control.
- Registry items install into `src/components/ui` in the `base` style. The two vendored style trees are not an install target.
- The specimen wrapper carries the theme tokens; the editor chrome never does.
- Non-colour parameters are identical in both modes after any edit.

**Security model**: none. Client side theme data only.

**Critical test scenarios**:
- Coverage: every key in the model appears in the export and in `globals.css`, verifies **AC-1**, **AC-2**, **AC-4**.
- Binding: change each parameter and confirm its specimen changes, verifies **AC-3**, **AC-6**, **AC-7**.
- Bounds: enter an out of range value for each numeric control, verifies **AC-8**.
- Drift: change one new token in `globals.css`, the drift test fails, verifies **AC-10**.
- Dependency scan: `package.json` contains no `@base-ui/react` and no `tailwind-variants`, verifies **AC-12**.
- Partial config: call `buildThemeCss` with one new token missing from a mode, it omits the token or throws with a message, verifies **AC-13**.

## Build plan

1. Extend the config type, defaults and storage merge with all 44 parameters, satisfies **AC-1**.
2. Add the derivation helpers for preset chart and sidebar values and for the shadow tokens, satisfies **AC-1**, **AC-5**.
3. Extend the generator and `globals.css` with the new tokens and `@theme inline` mappings, and make the generator omit or reject a missing token instead of writing `undefined`, satisfies **AC-4**, **AC-10**, **AC-13**.
4. Install `chart` from the registry in the `base` style into `src/components/ui` with the token from the environment, use it as the chart specimen, repoint the chart series in the six example cards from `fill-primary` and `stroke-primary` to `fill-chart-1` to `fill-chart-5`, leave the radio group check icon on `fill-primary`, build the hand built sidebar, font and shadow specimens, and wire tracking and spacing into the wrapper, satisfies **AC-3**, **AC-6**, **AC-7**, **AC-11**, **AC-12**.
5. Add the controls: data colours, sidebar, typography, shadows, with value display, satisfies **AC-2**, **AC-9**.
6. Add bounds and validation to every numeric control, satisfies **AC-8**.
7. Update fixtures and the drift test, run `npm test` and the build, satisfies **AC-5**, **AC-10**.

## Consequences

**Positive**:
- The editor covers the tweakcn parameter set with no inert controls.
- The chart binding runs on the real registry component with no new dependency.
- The twelve presets stay as authored, with one derivation rule instead of 156 new values.

**Negative / tradeoffs**:
- The panel grows by four groups, so the editor gets longer before the layout redesign that remains deferred.
- The derived chart palette is degenerate on neutral presets. Zinc's primary is `oklch(0.210 0.006 285.9)`, so rotating its hue cannot separate five colours: they land on `#18181b`, `#1a171a`, `#1b1717`, `#1a1816` and `#191815`, five near blacks that are useless as a chart palette. This is the cost of deriving instead of authoring 156 values.
- The sidebar specimen is hand built, so it shows the tokens on a stand in panel rather than on a real sidebar.
- Overriding `--spacing` inside the wrapper distorts every spacing utility in the specimen, which is the point and also a surprise if the preview looks suddenly cramped.

**Neutral**:
- `@theme inline` grows to roughly twice its current size.
- The shadow derivation is ours, not tweakcn's; only the six source parameters round trip.
- Repointing the chart series touches six example files across both styles and none of the generated mirror, because the mirror carries no chart series strings.

## Migration plan

**Strategy**: in place, additive. Stored configs gain fields through the merge on load.
**Phases**:
1. Model, defaults and derivations.
2. Tokens in the generator and the stylesheet.
3. Specimens and controls.
**Rollback**: revert the commit. Stored configs keep unknown keys harmlessly, and the defaults merge simply stops applying.
**Risks**: a parameter that is exported but unseen, caught by the coverage and binding checks, and a spacing override leaking outside the wrapper, caught by the chrome check.

## Follow-up

- [x] AC-13 is met. The guard throws in `src/registry/theme-export.ts`, and `test/theme-export.test.ts` deletes `sidebar-border` and asserts the missing light token throw, which the coordinator confirmed on 2026-11-05 with 13 tests across 3 files green.
- [ ] Revisit the registry sidebar only if the repo ever moves to the `@base-ui/react` and `tailwind-variants` family. It is the one parameter group with no registry component, and the cost is a second primitive family plus six components.
- [ ] Confirm the installed `chart` component passes the 0003 class scan once both land, and remove the five bar fallback if it is no longer needed.
- [ ] Author real chart palettes for the twelve built-in presets, or take the five chart colours from a tweakcn preset on import once 0006 lands. The import path fixes imported themes only, not the built-ins.
- [ ] The panel redesign in `docs/design/DESIGN.md` stays deferred; this slice only adds groups to the current panel.
