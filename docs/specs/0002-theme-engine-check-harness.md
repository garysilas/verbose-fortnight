# 0002. Add a check harness for the theme engine

**Date**: 2026-11-05
**Status**: Accepted

## Summary

The repo has no test script, no test runner and no test file, so every later claim about the generated CSS would be checked by eye. This spec adds Vitest, resolves the `@/` alias in tests, and moves the one export function out of the React component into a plain module so it can be called. It then pins today's output as a fixture, which turns the export rewrite in spec 0004 into a change the harness can see.

## Context

The only product output of this app is a block of CSS text. Today that text is produced in two places inside `src/components/theme-customizer.tsx`: a private `getThemeCode` function driven by a lodash template, and a React component that re-emits the same CSS as JSX spans. Neither can be called from a test, because the file is a client component that imports React, UI primitives and the clipboard helper.

The three slices that follow this one either change that text (spec 0004, spec 0005) or change what feeds it (spec 0003). Without a runner, each of those slices is verified by reading a dialog, which is how the existing `0.5remrem` radius defect survived: the value is a string with a unit, the template appends another unit, and nobody compared the output to an expectation.

A second constraint is that tests must not need a browser. The useful surface here is pure: token objects in, CSS text out. Anything needing a DOM is a `/check verify` job.

## Requirements

**User stories**:
- As the engineer changing the export, I want a command that fails when the generated CSS changes unexpectedly so that a rewrite cannot silently alter what users paste.
- As a reviewer, I want the current output written down as a fixture so that a diff shows exactly what a change did.

**Acceptance criteria**:
- **AC-1**: `package.json` has `"test": "vitest run"` and `vitest` as a dev dependency; no runtime dependency is added.
- **AC-2**: `vitest.config.ts` resolves `@/` to `src/`, so tests import project modules without a path shim, and sets `environment: "node"`.
- **AC-3**: `getThemeCode` and its template move out of `theme-customizer.tsx` into `src/registry/theme-export.ts` as an exported function, with the template text byte identical to the version in git history; the component imports it and no copy remains.
- **AC-4**: `test/theme-export.test.ts` compares the full output for the zinc preset against `test/fixtures/zinc-default.css`, character for character.
- **AC-5**: a second test calls the function with the stored preset radius string `"0.5rem"` and asserts the current `0.5remrem` output, so the existing defect is recorded as behaviour, not lost.
- **AC-6**: changing one character of the fixture makes `npm test` fail, proving the comparison is exact.
- **AC-7**: no test imports React, a component, or a browser API.
- **AC-8**: the dialog and the header copy still show and copy the same text as before the move for the default theme.

## Options considered

### Option 1: Vitest

Add Vitest as a dev dependency with one small config that maps the alias.

**Pros**:
- TypeScript and the `@/` alias work with no extra loader.
- Runs pure modules fast and can grow into component tests later if they are ever wanted.

**Cons**:
- A large dev dependency tree for a project that needs one function tested.
- Another tool the team must keep current.

### Option 2: node test runner with tsx

Use `node --test` with `tsx` for TypeScript, and a small import shim for the alias.

**Pros**:
- No test framework, near zero config, aligns with the platform.

**Cons**:
- The alias needs a loader hook or relative imports, so tests read differently from app code.
- Assertions and mocks are sparser, and the fixture diff story is weaker.

### Option 3: No runner, check by hand

Keep verifying the dialog visually.

**Pros**:
- No new dependency.

**Cons**:
- Specs 0004 and 0005 change the exact text this app exists to produce and cannot be checked.
- The defect class that already exists stays invisible.

## Decision

**Chosen option**: Option 1: Vitest.

Add Vitest with a node environment and the `@/` alias, move `getThemeCode` and its template into `src/registry/theme-export.ts` unchanged, and pin the current output as a characterization fixture before any rewrite. Vitest is pinned to `^3.2.4` (resolved 3.2.7) on purpose: 5.x pulls Vite 8, whose peer range rejects this repo's `@types/node` 20.4.8, so do not upgrade it casually.

**Implementation skills**: none installed for Vitest in this project.

## Rationale

The decision is about what the next three slices can see, not about testing style. Spec 0004 replaces this function entirely and must prove byte identity where the contract says identical and a deliberate change where it says changed. That needs an exact string comparison against a committed fixture, which is a five line test with any runner and a judgement call without one.

Vitest wins over `node --test` because this repo imports everything through `@/` and a runner that needs a loader hook would make tests read unlike the app. The cost is a dev dependency tree, which is acceptable for a project whose output is a string of CSS.

## Feature design

**Module API**:

| Export | Input | Output | Used by |
|---|---|---|---|
| `getThemeCode(theme, radius)` | a theme object with `cssVars`, a radius number | the v3 CSS string | header copy, dialog copy |
| `BASE_STYLES_WITH_VARIABLES` | internal template | none | `getThemeCode` only |

**Value sourcing**:

| Action | Value produced | Source |
|---|---|---|
| Fixture comparison | expected CSS text | `test/fixtures/zinc-default.css`, committed |
| Fixture comparison | actual CSS text | `getThemeCode(themes.zinc, 0.5)` |
| Defect record | `0.5remrem` string | `getThemeCode(themes.zinc, "0.5rem")`, the value the config actually holds |

**Invariants**:
- The move changes no output. The only edit inside the function is the export keyword.
- The fixture is a record of today's behaviour. A later spec that changes behaviour updates the fixture in the same commit and says so.
- Tests import modules only, never components.

**Security model**: none. No input from a network or a user is under test.

**Critical test scenarios**:
- Happy path: run `npm test`, both cases pass, verifies **AC-1**, **AC-4**, **AC-5**.
- Failure: change one character of the fixture, the run fails, verifies **AC-6**. Confirmed by the coordinator on 2026-11-05: a one character edit gave 1 failed and 1 passed, and the restored fixture returned to md5 `a2d891ff7a0676961f7ce8af82474298` with both tests green.
- Alias: the test imports `@/registry/themes` and resolves, verifies **AC-2**.

## Build plan

1. Add `vitest` as a dev dependency and the `test` script, satisfies **AC-1**.
2. Add `vitest.config.ts` with the alias and node environment, satisfies **AC-2**.
3. Move `getThemeCode` and the template into `src/registry/theme-export.ts` and import them in the component, satisfies **AC-3**, **AC-8**.
4. Capture the zinc output into `test/fixtures/zinc-default.css` and write the comparison test, satisfies **AC-4**.
5. Add the radius defect case, a single character mutation check, and run `npm test`, satisfies **AC-5**, **AC-6**, **AC-7**.

## Consequences

**Positive**:
- The export rewrite can be proven, and the known radius defect is written down instead of remembered.
- Later features get a runner for free.

**Negative / tradeoffs**:
- A dev dependency tree and one more config file to maintain.
- The fixture pins a defect, so spec 0004 must update it deliberately rather than discover it.

**Neutral**:
- Tests live in `test/`. Feature suites written later belong to `/test`; this slice only adds the runner and the characterization case.

## Migration plan

**Strategy**: no migration needed. Nothing stored or deployed changes; the app behaves identically after the move.
**Phases**: none.
**Rollback**: revert the commit; the function returns to the component.
**Risks**: a subtle difference introduced while moving the template, caught by AC-3's byte comparison against git history.

## Follow-up

- [ ] Vitest 3.x is deliberate: 5.x needs Vite 8 and rejects `@types/node` 20.4.8. Revisit only with a Node types bump.
- [ ] Spec 0004 changes the function signature, deletes the template and updates both fixtures.
- [ ] Consider component level tests later only if the preview logic grows real behaviour; the current value is in pure functions.
