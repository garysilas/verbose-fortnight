# 0001. Move the build to Tailwind 4 with npm

**Date**: 2026-11-05
**Status**: Accepted

## Summary

The app pins Tailwind 3.3, so every theme it exports is a Tailwind 3 theme and the repo's components speak a class language that Tailwind 4 changed. This spec moves the build itself to Tailwind 4.3 with npm and the new PostCSS plugin, and rewrites the global CSS to the Tailwind 4 form. It changes no component and no theme value, so the app should boot and look close to today, with the accepted Tailwind 4 default shifts in ring width, shadow and radius.

## Context

Tailwind 4 replaced the JavaScript config file with CSS. The `@tailwind` directives, the `content` globs, the `theme.extend` object and the `tailwindcss-animate` plugin all leave, replaced by `@import "tailwindcss"`, automatic source detection, `@theme inline`, and `tw-animate-css`. Autoprefixer is no longer needed. A separate CSS file that uses `@apply`, such as `src/styles/mdx.css`, must name the stylesheet it borrows utilities from with `@reference`, because v4 no longer shares one global utility context across files.

The repo has two lockfiles: `bun.lockb` and `package-lock.json`, and `node_modules` was installed by npm. A v4 upgrade applied over two managers produces an install nobody can reproduce. The user has chosen npm and the v4 defaults, so this spec records both as given rather than as open questions.

Next and React stay at 14.2 and 18.2. Tailwind 4 requires PostCSS 8.4, which the repo already has. The consequence of not deciding is concrete: the customizer keeps emitting Tailwind 3 CSS that no longer matches the class names its own components use, and the v4 work in later specs has no foundation to stand on.

## Requirements

**User stories**:
- As the engineer maintaining this demo, I want the app built on Tailwind 4 so that what the customizer previews, exports and documents matches the current Tailwind major.
- As a visitor, I want the site to render the same palette, layout and dark mode after the upgrade so that the migration is invisible apart from the accepted v4 default shifts.

**Acceptance criteria**:
- **AC-1**: `bun.lockb` is deleted and npm with the existing `package-lock.json` is the only package manager; no bun artifacts remain.
- **AC-2**: `tailwindcss` and `@tailwindcss/postcss` resolve to 4.3.4, `tw-animate-css` to 1.4.0, and `autoprefixer` and `tailwindcss-animate` are removed from the manifest and from the PostCSS config.
- **AC-3**: `tailwind.config.js` is deleted and the build reports no missing config and no content warning.
- **AC-4**: `src/app/globals.css` starts with `@import "tailwindcss"`, declares `@custom-variant dark (&:is(.dark *))`, and maps every semantic colour, the radius scale and the accordion animation through `@theme inline`.
- **AC-5**: `:root` and `.dark` keep the same token names and the same effective colours as today, so the default theme is visually unchanged.
- **AC-6**: class based dark mode still works. `next-themes` puts `.dark` on the html element, tokens switch, and the one `dark:` utility in `alert.tsx` applies.
- **AC-7**: `src/styles/mdx.css` compiles with a `@reference` line and its twelve `@apply` rules resolve on both routes that import it.
- **AC-8**: `components.json` names `src/app/globals.css` and leaves `tailwind.config` empty, the form the v4 CLI expects.
- **AC-9**: home, blocks list, block detail and the open customizer all render at 390 and 1440 with no unstyled utility, including classes that appear only inside registry source strings.
- **AC-10**: `next`, `react` and `react-dom` versions are unchanged.
- **AC-11**: `components.json` carries a `registries` entry named `@shadcnio` whose URL has no query token and which resolves the shadcn.io token from the `SHADCNIO_TOKEN` environment variable; `.env.example` lists `SHADCNIO_TOKEN` with an empty value. No token, and no URL containing a token, is committed.
- **AC-12**: a registry request made without a token fails non zero with a message naming `SHADCNIO_TOKEN` and the account page, never an empty success. The app makes no registry request at runtime.

## Options considered

### Option 1: Upgrade in place in one pass

Keep the app, the routes and the components, and change only the toolchain and the global CSS.

**Pros**:
- One small commit, easy to read and to revert.
- No route or component churn, so any visual difference comes from v4 defaults alone.

**Cons**:
- The app temporarily runs v4 utilities against v3 class meanings until spec 0003 lands.

### Option 2: Stay on Tailwind 3, add a v4 export only

Generate v4 CSS from the v3 model and leave the app on 3.3.

**Pros**:
- No build risk at all.

**Cons**:
- The preview keeps showing v3 rendering while exporting v4 CSS, so the customizer lies about what the user gets.
- Every later slice needs a v3 and a v4 path.

### Option 3: Re scaffold on Tailwind 4 and port the app

Start from a fresh Next and Tailwind 4 project and move the pages over.

**Pros**:
- Clean config with no legacy residue.

**Cons**:
- Ports 778 tracked files for no benefit; the app code is identical either way.
- Loses the existing docs and the vendored registry history.

## Decision

**Chosen option**: Option 1: Upgrade in place in one pass.

Upgrade the existing app in place to Tailwind 4.3.4 with npm, delete `bun.lockb` and `tailwind.config.js`, replace the PostCSS plugin, swap `tailwindcss-animate` for `tw-animate-css`, and rewrite `src/app/globals.css` as a v4 entry with `@theme inline`. Keep token values as HSL triplets in this slice; spec 0004 converts them.

**Implementation skills**: none installed for Tailwind or Next in this project.

## Rationale

Option 1 is the only one that keeps the product honest at every step. The later export rewrite in spec 0004 needs a v4 CSS pipeline to emit into, and spec 0003 needs v4 utilities to converge on. Keeping v3 for the preview while exporting v4, option 2, would create exactly the drift the scope is trying to remove. Option 3 buys a clean config at the price of porting an app whose code does not change, and it would discard the vendored registry and design docs that the slices depend on.

The upgrade risk is low because it touches two config files, one stylesheet and the manifest. The one real trap is `@apply` in a separate file, handled by AC-7.

## Feature design

**Build configuration**:

| Setting | Before | After |
|---|---|---|
| PostCSS plugin | `tailwindcss` + `autoprefixer` | `@tailwindcss/postcss` |
| Config source | `tailwind.config.js` | `@theme inline` in `globals.css` |
| Content | explicit globs | automatic detection |
| Dark mode | `darkMode: ["class"]` | `@custom-variant dark (&:is(.dark *))` |
| Animation plugin | `tailwindcss-animate` | `@import "tw-animate-css"` |
| Lockfile | `bun.lockb` + `package-lock.json` | `package-lock.json` |
| Registry | none | `@shadcnio` in `components.json`, token from `SHADCNIO_TOKEN` |

**Theme mapping** (the shape `@theme inline` must produce):

| Token group | v4 declaration |
|---|---|
| Colours | `--color-<name>: hsl(var(--<name>))` for the 19 semantic tokens, the temporary bridge until spec 0004 stores complete colours |
| Radius | `--radius-lg: var(--radius)`, `--radius-md: calc(var(--radius) - 2px)`, `--radius-sm: calc(var(--radius) - 4px)` |
| Animation | `--animate-accordion-down` and `--animate-accordion-up` with their keyframes |

**Invariants**:
- One place defines a token: `:root` and `.dark` in `globals.css` hold the defaults, `src/registry/themes.ts` holds per preset overrides.
- No component or theme value changes in this slice.
- `@theme inline` may not contain a hardcoded colour; it maps tokens only. The `hsl()` wrapper around a triplet is the one temporary exception, and spec 0004 removes it.
- The shadcn.io token lives in `.env.local` only. `components.json` names the environment variable, never the value.
- Registry payloads and install commands often embed the token in their URLs, including inside `registryDependencies`. Strip every `?token=` value before pasting one into a spec, a doc, or a test, and scrub a captured fixture before it is written, not after.
- `.gitignore` already covers `.env` and `.env*.local`, so the token file needs no new ignore rule.

**Security model**: none. The app is a public client side demo with no accounts and no stored user data.

**Value sourcing**:

| Action | Value produced | Source |
|---|---|---|
| Utility generation | CSS for one class | the class found in `src` by automatic detection |
| Token resolution | a colour for one utility | the token in `globals.css`, or the preset override injected on the preview wrapper |
| Accordion animation | keyframe and animation values | the `@theme inline` declarations in this spec |

**Critical test scenarios**:
- Happy path: build, serve, load home and open the customizer at 1440 in both modes, verifies **AC-5**, **AC-6**.
- Regression: switch mode and confirm the alert specimen's `dark:` border applies, verifies **AC-6**.
- Build failure: load the blocks detail route, which imports `mdx.css`, verifies **AC-7**.
- Detection: find a class used only inside a registry source string and confirm its CSS is generated, verifies **AC-9**.

## Build plan

1. Remove `bun.lockb`, set the dependency versions and remove the two retired packages in `package.json`, then install with npm so `package-lock.json` is regenerated, satisfies **AC-1**, **AC-2**.
2. Replace `postcss.config.js` with the single `@tailwindcss/postcss` plugin, satisfies **AC-2**.
3. Rewrite `src/app/globals.css`: import, dark variant, token blocks unchanged, `@theme inline` mapping with the temporary `hsl()` bridge, base border rule, satisfies **AC-4**, **AC-5**, **AC-6**.
4. Add the `@reference` line to `src/styles/mdx.css` and confirm its twelve `@apply` rules compile, satisfies **AC-7**.
5. Fix `components.json` to the real CSS path and an empty `tailwind.config`, satisfies **AC-8**.
6. Delete `tailwind.config.js`, satisfies **AC-3**.
7. Build and walk the three routes plus the customizer at 390 and 1440, checking for unstyled utilities, satisfies **AC-9**, **AC-10**.
8. Add the `@shadcnio` registry entry to `components.json` with no token in its URL, keep `SHADCNIO_TOKEN` in `.env.example`, and confirm the exact registries shape with the `shadcn-io` MCP `get_project_setup` tool, then check that a request without a token fails loudly, adding a small guard script if the CLI message does not name the variable, satisfies **AC-11**, **AC-12**.

## Consequences

**Positive**:
- Later slices have a v4 pipeline to target, and the path to a v4 export is open.
- One package manager and one lockfile remove a class of unreproducible installs.

**Negative / tradeoffs**:
- Between this spec and spec 0003, components still use v3 class meanings, so the look shifts in small ways before the code catches up.
- `@apply` in a separate file is now an explicit dependency on `globals.css`, which must be kept in the reference path if files move.

**Neutral**:
- The build no longer has a config file, so token discovery moves to CSS for anyone used to the old setup.
- The registry adds one local secret and one external dependency for component installs. The token exists and was verified live on 2026-11-05; discovery through the `shadcn-io` MCP works without it, and item installs need it.

## Migration plan

**Strategy**: big bang, one commit, one deploy target (a demo site).
**Phases**:
1. Manifest, lockfile and PostCSS change.
2. Stylesheet rewrite and `@reference`.
3. Config deletion, then build and route check.
**Rollback**: revert the commit. The v3 config, plugin and lockfile return together, and no data or theme state changes in this slice.
**Risks**: a missed `@apply` in another CSS file, or a utility the registry uses only in strings and therefore relies on detection to catch. Both surface in the route check.

## Follow-up

- [x] `SHADCNIO_TOKEN` is in the project's `.env.local`, placed there before the build started. `.gitignore` covers `.env*.local` on line 29 and `git status` does not list the file, so the value stays local and is never printed, pasted into a spec, or written into a tokenised URL. Installs are exercised when task 8 runs.
- [ ] Spec 0003 converges component classes on v4 meaning; until then the app runs mixed meanings by design.
- [ ] Spec 0004 converts the token values to oklch and replaces the HSL triplet blocks written here.
- [ ] No root `AGENTS.md` existed when this spec was written; this pass adds one, so later skills read npm, the commands and the registry duplication rules from the repo instead of from a brief.
