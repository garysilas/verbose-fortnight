# 0003. Converge component classes on Tailwind 4 meaning

**Date**: 2026-11-05
**Status**: Accepted

## Summary

After the toolchain moves, the components still use a mix of Tailwind 3 class meanings. This spec changes only the classes whose meaning changed in a way that would mislead a user or weaken accessibility, and leaves the ones whose new value is an accepted default shift. It also upgrades `tailwind-merge` so `cn()` understands the new class names. The practical effect is a small diff: 154 focus outlines, 5 important modifiers, 3 gradients, plus the merge library.

## Context

Tailwind 4 renamed some utilities and shifted the value scale of others. The distinction matters more than the count. A renamed utility that now means something else is a correctness problem: `outline-none` used to remove the visible focus outline while keeping a forced colors outline, and in v4 it sets `outline-style: none`, which removes the fallback. A shifted scale is a design change: `rounded-sm`, `shadow-sm` and `blur-sm` are larger in v4 because the scale grew a step at the bottom.

The user has accepted the v4 scale defaults, which removes the second category from the work. No `-xs` downgrades and no ring width compensation are wanted. That shrinks this slice from a scale rewrite to a meaning review, and it is why the spec is short.

The repo carries its component sources in several places: `src/components/ui` used by the app, `src/registry/default/ui` and `src/registry/new-york/ui` previewed and exported, the examples and blocks under each style, and `src/__registry__/index.tsx`, a generated file whose strings are the code users copy. They are related but not byte identical, so a scripted replace has to run across all of them and the result has to be scanned, not assumed.

`tailwind-merge` is pinned at 1.14.0, a line that predates v4. `cn()` is imported in 216 files, and its job is to resolve conflicting utilities by position. It resolves by a class table, so a table that does not know the renamed and rescaled v4 utilities will silently keep the wrong one of a pair.

## Requirements

**User stories**:
- As a user copying component code, I want the code I copy to be correct Tailwind 4 so that it renders the way the preview showed it.
- As a keyboard user, I want focus outlines hidden only where the design intends, with the forced colors fallback intact.

**Acceptance criteria**:
- **AC-1**: every `outline-none` whose intent is to remove a focus outline becomes `outline-hidden`; 154 occurrences across `src/components` (36), `src/registry` (78), `src/__registry__` (38) and `src/app` (2), and a scan returns zero remaining.
- **AC-2**: the five `!text-center` become `text-center!`; a scan for a leading important modifier returns zero.
- **AC-3**: the three `bg-gradient-to-b` become `bg-linear-to-b`; a scan for `bg-gradient-to-` returns zero.
- **AC-4**: `rounded-sm`, `shadow`, `shadow-sm`, `blur-sm` and `ring` keep their names and take the v4 values; a scan finds no `-xs` downgrade and no explicit ring width or radius compensation added to preserve the v3 look.
- **AC-5**: `tailwind-merge` moves to the 3.x line that targets Tailwind 4, `cn()` in `src/lib/utils.ts` keeps its signature, and a test shows last class wins for a conflicting pair (`p-2 p-4` yields `p-4`, `shadow-sm shadow-md` yields `shadow-md`).
- **AC-6**: the source strings inside `src/__registry__/index.tsx` match the updated component files, so the code shown in the blocks and preview pages is v4.
- **AC-7**: the change covers the UI components, the examples and the blocks in both styles, not only `src/components/ui`.
- **AC-8**: the app builds and the three routes render, with only the accepted v4 default shifts, and no component loses a visible focus state.

## Options considered

### Option 1: Rename in place with a per class meaning review

Go class by class, decide by intent, and apply the result to every copy of the source.

**Pros**:
- Keeps the repo's own structure, dependencies and style pairs intact.
- Small diff, every changed class explainable.
- Nothing is pulled from an upstream family this repo does not use.

**Cons**:
- The vendored copies stay a local fork, so upstream v4 fixes are not picked up.
- Depends on the review being done, not on a bulk replace.

### Option 2: Re vendor the current shadcn v4 sources

Replace each component with the current registry version.

**Pros**:
- Matches the upstream look and gets new states (loading, invalid) for free.

**Cons**:
- The current registry targets a different dependency family: a single `radix-ui` package and `tailwind-variants`, while this repo pins `@radix-ui/react-*` and `class-variance-authority`. A copy would not compile without a dependency migration that the user has not authorized.
- It changes the look far more than v4 defaults, for example the 32px default control height.

### Option 3: Mechanical replace of every listed class

Script every class in the findings table to its v3 preserving equivalent (`shadow-sm` to `shadow-xs`, `rounded-sm` to `rounded-xs`, ring width compensation).

**Pros**:
- One pass, no judgement.

**Cons**:
- Preserves the v3 look, which the user explicitly declined.
- Fixes the scale but not meaning: `outline-none` would still be wrong.

## Decision

**Chosen option**: Option 1: Rename in place with a per class meaning review.

Apply the meaning changes only, keep the scale names, and upgrade `tailwind-merge` to the v4 aware line in the same commit.

**Implementation skills**: none installed for shadcn, Tailwind or tailwind-merge in this project.

## Rationale

Option 2 is the option that looks cheaper than it is. The registry moved to a different dependency family, so re vendoring is a stack change dressed as a copy, and it would exceed this scope and the user's decision to keep the framework and dependencies stable. Option 3 contradicts the user's accepted look shift and leaves the semantic bug in place.

Option 1 costs a review, which is cheap here because the shifted classes need no action at all. That is the whole reason this slice is small: the biggest counts in the earlier inspection (`rounded-sm` at 83, `ring-offset` at 108, `shadow-sm` at 31) are value shifts or unchanged, and only the 162 meaning changes require edits.

## Feature design

**Class mapping**:

| Class | Occurrences | v4 behaviour | Action |
|---|---|---|---|
| `outline-none` | 154 | now `outline-style: none` | rename to `outline-hidden` |
| `!text-center` | 5 | important moved to suffix | rename to `text-center!` |
| `bg-gradient-to-b` | 3 | renamed family | rename to `bg-linear-to-b` |
| `rounded-sm` | 83 | value shifts up one step | keep, accept |
| `shadow-sm`, `shadow` | 31 plus bare uses | value shifts up one step | keep, accept |
| `blur-sm` | 4 | value shifts up one step | keep, accept |
| `ring` | few bare uses, most are explicit `ring-2` | width default changes | keep, accept; explicit widths unaffected |
| `ring-offset` | 108 | unchanged | none |

**Invariants**:
- A class change lands in every copy in the same commit: `src/components/ui`, both registry styles, the examples and blocks, and the strings in `src/__registry__/index.tsx`.
- No new utility is introduced to emulate a v3 value.
- `cn()` stays the single merge point. No component calls `twMerge` directly.

**Value sourcing**:

| Action | Value | Source |
|---|---|---|
| Class scan | expected zero hits per rule | the mapping table above, run over `src` |
| `cn()` proof | merged class list | the two conflicting strings in the test |

**Security model**: none. Class strings only.

**Critical test scenarios**:
- Scan: each rename rule returns zero remaining hits across all four source locations, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**.
- Merge: `cn("p-2 p-4")` returns `p-4` and `cn("shadow-sm shadow-md")` returns `shadow-md`, verifies **AC-5**.
- Focus: tab through the dialog, button, select and command surfaces in both modes and confirm a visible focus ring, verifies **AC-8**.

## Build plan

1. Upgrade `tailwind-merge` to 3.x and add the merge test, satisfies **AC-5**.
2. Apply the mapping to `src/components/ui`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-7**.
3. Apply the mapping to `src/registry/default` including examples and blocks, satisfies **AC-1**, **AC-3**, **AC-7**.
4. Apply the mapping to `src/registry/new-york` including examples and blocks, satisfies **AC-1**, **AC-3**, **AC-7**.
5. Apply the mapping to the route files in `src/app`, satisfies **AC-1**, **AC-2**.
6. Apply the same replacements to the source strings in `src/__registry__/index.tsx`, satisfies **AC-6**.
7. Run the scans, `npm test` and the build, then walk the three routes and the customizer for focus states and the accepted shifts, satisfies **AC-4**, **AC-8**.

## Consequences

**Positive**:
- Copied code is correct v4, and focus handling keeps its forced colors fallback.
- The merge library understands the class names the app now uses.

**Negative / tradeoffs**:
- The fork stays a fork; no upstream v4 changes arrive automatically.
- The vendored copies can drift from each other, and this slice relies on the scan to catch it.

**Neutral**:
- The generated registry file is edited by hand because the repo has no generator; that is a known gap recorded below.
- The sweep covered renamed utilities only. Arbitrary values containing a comma, such as `lg:grid-cols-[1fr,320px]`, are a separate failure mode: Tailwind 4 does not emit them, with no build error and no warning, so the layout falls back silently. Search for `-\[[^]]*,` and write underscore separated arbitrary values in v4.

## Migration plan

**Strategy**: big bang, one commit, no stored data.
**Phases**:
1. Merge library and its test.
2. Class changes per location.
3. Scan and route check.
**Rollback**: revert the commit; no theme state or user data is involved.
**Risks**: a missed copy, which the scan catches, and a focus state lost by renaming in a context where `outline-hidden` is not equivalent, caught by the keyboard pass.

## Follow-up

- [x] One comma arbitrary value existed in application code, `lg:grid-cols-[1fr,320px]` on the home promo card, and it had silently collapsed the grid, so a 320px image rail rendered at full card width. Removed with the image in commit `fb9d339`. A search for `-\[[^]]*,` now returns nothing under `src`.
- [ ] `src/__registry__/index.tsx` is generated upstream but has no generator script in this repo. Restore or write one so the strings stop being hand maintained.
- [x] `tailwind-merge` 3.7.0 is installed and recorded in the lockfile, on the 3.x line chosen for v4 class awareness.
- [ ] Upstream registry parity stays out of scope until someone decides to move to the `radix-ui` and `tailwind-variants` family.
