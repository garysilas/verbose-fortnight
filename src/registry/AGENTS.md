# Registry

## Overview

Holds the vendored shadcn/ui sources the app previews and the code users copy from the block pages. There are four related namespaces: the app's own copies in `src/components/ui`, the two registry styles, and a generated mirror whose strings are the code shown in the UI.

## Key files

| File | Owns |
|---|---|
| `src/registry/ui.ts` | the UI component manifest |
| `src/registry/examples.ts` | the example manifest, 144 and 143 files per style |
| `src/registry/blocks.ts` | the block manifest, 36 and 38 files per style |
| `src/registry/registry.ts` | the merged registry export |
| `src/registry/themes.ts` | 12 preset themes, token values per mode |
| `src/registry/styles.ts` | the `default` and `new-york` style names |
| `src/registry/schema.ts` | zod types for registry entries |
| `src/registry/<style>/ui` | 47 components per style |
| `src/__registry__/index.tsx` | the generated mirror, 5,746 lines of source strings |

## Conventions

- New components come from the shadcn.io registry, not hand written. See the component sourcing section in the root `AGENTS.md`.
- A change to a shared component usually lands in four places: `src/components/ui`, `registry/default/ui`, `registry/new-york/ui`, and the matching strings in `src/__registry__/index.tsx`.
- Blocks and examples are product output as much as app code. Keep them on the same Tailwind major as the app, because users copy them.
- `themes.ts` is data only. No logic, no derived values, unless a spec puts a derivation helper beside it.
- The two styles differ in size and radius, not only in colour. Do not copy one onto the other.

## Gotchas

- `src/registry/default` and `src/registry/new-york` are not byte identical, and neither matches `src/components/ui` exactly. Diff before replacing.
- There is no generator script for `src/__registry__` in this repo. Edit its strings by hand and keep them equal to the files they mirror.
- 778 tracked TypeScript files exist, most of them here. A repo wide replace is intended for class renames and dangerous for anything behavioural.

## Related specs

- `docs/specs/0003-v4-class-conformance.md`
- `docs/specs/0004-oklch-tokens-single-export-generator.md`
- `docs/specs/0005-tweakcn-parameter-binding.md`

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
