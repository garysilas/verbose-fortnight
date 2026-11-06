# 0006 code review

**Verdict: ship with fixes.** The route and credential handling hold. Two import defects violate AC-4 and the all-or-nothing invariant, and the tests miss both.

## Findings

1. **High, AC-4: `theme` does not win for fonts or radius** (`src/registry/theme-import.ts:63`, `:184-194`). For a key in `THEME_AUTHORITY_KEYS`, `sourceValue` comes from `theme`, but `lightValue` then prefers `light` whenever the key exists, which is exactly the duplicate case the spec names. Probed directly: `light font-sans = "LIGHT-FONT"`, `theme font-sans = "THEME-FONT"` imports as `LIGHT-FONT` in both modes; `theme radius = 0.25rem` with `light radius = 1rem` imports as `1rem`. The losing duplicate is also never added to `ignored` (only keys outside the 44 are, line 174), so the loss is silent. The test passes because the fixture duplicates identical values.

2. **High, all-or-nothing invariant and AC-6: a partial payload returns `ok: true` with `undefined` tokens** (`:191-194`, `:225`). All 32 colour keys plus `radius`, no fonts or spacing: import succeeds, `cssVars.light["font-sans"]` and `spacing` are `undefined`, and `buildThemeCss` then throws `missing light token --font-sans`. The dialog applies that config, leaving the preview short of vars and the copy button throwing. Non-colour keys are copied with no type or presence check.

3. **Medium, AC-6: a missing `radius` throws instead of returning a message** (`:208`, `:137`). No radius in `theme`, `light` or `dark` gives `TypeError: Cannot read properties of undefined (reading 'trim')`. The dialog's catch shows the network message ("That link could not be read...") for JSON input.

4. **Low: non-string non-colour values pass.** `font-sans: {}` imports ok and stores an object; the export serialises it and the preview renders "[object Object]". Prototype keys are only reported, not applied; no pollution observed.

5. **Low, AC-7: the preview shows the name and ignored keys, not the parsed colours**, so the user confirms a theme they cannot see.

6. **Low, hardening: the route reads the upstream body with no size cap** (`src/app/(app)/api/themes/[id]/route.ts:52`) and has no rate limit. Timeout is 10s. Neither breaks AC-9.

7. **Low: the tracking scale is never read from `theme`.** `theme.tracking-*` is reported as ignored; `letter-spacing` is taken from `light`. AC-2 names the theme group for tracking, AC-3 names `tracking-normal` as never read; the implementation picks the latter.

## What checked out

- Route: `^[A-Za-z0-9_-]+$` before any fetch, fixed `https://tweakcn.com/r/themes/<id>.json`, `redirect: "manual"` with 3xx to 404, 500 and other non-200 to 404, timeout or network to 502, unparseable 200 to 502, import failure to 422, response built from our own fields. No token header, no upstream echo, no console logging, no middleware rewrite.
- Credentials: fixture has no `token=`, no `registryDependencies`; the live `.env.local` value appears in no other file (`grep -rF`); `.env.local` untracked and ignored.
- AC-3: derived keys and `css` reported, nothing applied. AC-5: zinc round trip byte identical; foreign fixture export 1 = 2 = 3, 44 keys per mode.
- `npm test`: 13 passed.
