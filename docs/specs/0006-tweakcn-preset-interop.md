# 0006. Import and export tweakcn presets

**Date**: 2026-11-05
**Status**: Accepted

## Summary

This spec makes the customizer speak tweakcn's preset format. A theme can be exported as a tweakcn registry item, and a pasted preset or share link can be imported, normalised and applied. A live check of the service confirmed the link contract, so the import can be built against a known endpoint. Values tweakcn derives rather than stores are reported and never imported.

## Context

tweakcn describes a theme as a registry item whose `cssVars` object carries the full parameter set for light and dark. Our model after spec 0005 carries the same parameters, and after spec 0004 stores them as complete oklch colours, so the two models line up and the work is parsing, normalising and reporting rather than translating colour models.

The share link contract was verified against the live service on 2026-11-05. `GET https://tweakcn.com/r/themes/<id>.json` returns `200` for built-in ids and `500` for an unknown id, and success carries `Access-Control-Allow-Origin: *`. The payload is a shadcn registry item with `type: "registry:style"` and a `cssVars` object holding three groups: `theme` with fonts, radius and the tracking scale, and `light` and `dark` with the mode values. The page route `https://tweakcn.com/themes/<id>` returns `200` even for an id that does not exist, so existence has to be judged from the JSON endpoint status, never from the page.

The editor route was probed as well, and it is excluded on purpose. `https://tweakcn.com/editor/theme/claude` and `https://tweakcn.com/editor/theme/nonexistent-id-xyz` both return `307` to `/editor/theme`, because the route reads the id and then redirects before rendering. A real id and a fake id are indistinguishable from the redirect, so an editor URL carries no resolvable id server side. Supporting it later would need a client side read of a page that no longer routes, so it stays out and the spec says why.

Three details shape the design. `light` and `dark` each carry the 44 parameters plus nine keys tweakcn derives from them (`shadow-2xs` through `shadow-2xl`, and `tracking-normal`), so import needs a whitelist rather than a merge. `radius` appears in `theme` and again in each mode, so one of them has to be named the authority or the import is ambiguous. And the item carries a `css` block, which is arbitrary CSS and must be handled explicitly rather than applied. Registry payloads also embed their fetch token inside the `registryDependencies` URLs, so a captured payload is a credential until it is scrubbed.

## Requirements

**User stories**:
- As a user, I want to bring a tweakcn preset into this editor and export it back unchanged, so that I can use both tools on one theme.
- As a user, I want to know when a preset had a value this editor cannot represent, so that I do not ship a theme that silently lost a colour.

**Acceptance criteria**:
- **AC-1**: export produces a registry item with `name` set to the current theme name, `type: "registry:style"` and `cssVars` holding `light` and `dark` with all 44 parameters.
- **AC-2**: import accepts a registry item with `cssVars`, a bare `cssVars` object, or a bare `{ light, dark }` pair, and reads the `theme` group for the three fonts, radius and the tracking scale.
- **AC-3**: only the 44 supported keys are applied. The nine derived keys (`shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `tracking-normal`) and the `css` block are reported in the ignored list and never applied.
- **AC-4**: one authority is stated and enforced. `theme` wins for fonts, radius and tracking; `light` wins for colours, spacing and the six shadow parameters when the modes disagree; any duplicate that was ignored is named in the report.
- **AC-5**: exporting after importing our own export is byte identical, and importing a foreign preset then exporting twice is stable from the second export onward, so normalisation is idempotent.
- **AC-6**: invalid JSON, a missing `light` block or a non colour value fails with a readable message and leaves the current theme untouched.
- **AC-7**: the user sees the parsed theme and its ignored keys and confirms before it is stored; cancelling changes nothing.
- **AC-8**: a share link resolves on the server, and exactly two link shapes are accepted: `https://tweakcn.com/themes/<id>` and `https://tweakcn.com/r/themes/<id>.json`. Both normalise to the same id, the id is validated against a safe character set, and the fetch always goes to `https://tweakcn.com/r/themes/<id>.json`, so the shapes differ only in where the id is read. The response status decides existence: `200` parses, `500` and any other non success reads as a theme that does not exist. Editor URLs are rejected deliberately, because `/editor/theme/<id>` returns `307` to `/editor/theme` for a real id and a fake one alike.
- **AC-9**: the route cannot be used as a proxy. It accepts only those two shapes on that host, fetches only the one fixed path, does not follow a redirect to another host, and returns its own JSON rather than the upstream body.
- **AC-10**: any captured registry payload used as a fixture is sanitised before it is written: every `?token=` value is removed from every URL, including the ones inside `registryDependencies`, and the saved file contains no credential. The rule covers a payload from either service.

## Options considered

### Option 1: Registry item in and out, share links through a server route

Export the item, parse all three import shapes with a whitelist and one normaliser, and resolve links on the server.

**Pros**:
- Matches the verified format and keeps the browser free of third party reads.
- The whitelist and the authority rule make the import deterministic.

**Cons**:
- Adds a route handler and one server side fetch.
- Depends on tweakcn keeping the `/r/themes/<id>.json` shape.

### Option 2: Registry item only, drop share links

Ship JSON import and export and leave links out.

**Pros**:
- No network dependency, fully testable.

**Cons**:
- Contradicts the user's decision to include share links.
- Ignores a contract that is now verified, so the risk that justified dropping it is gone.

### Option 3: Resolve links in the browser

Fetch the share link directly from the client, using the open CORS header.

**Pros**:
- No server route, and the CORS header currently allows it.

**Cons**:
- Depends on a third party header staying open, and puts a cross origin read inside the editor.
- Browser level network errors would arrive without a status, so existence handling gets weaker.

## Decision

**Chosen option**: Option 1: Registry item in and out, share links through a server route.

Export the registry item, import the three shapes with an explicit whitelist, normalise colour values once into our format, resolve share links through one route handler pinned to the verified endpoint, and report every ignored key.

**Implementation skills**: none installed for tweakcn in this project.

## Rationale

The round trip is the acceptance test, and it only means something if the model is the same on both sides. After specs 0004 and 0005 it is, so option 2 would give up a user decision for a risk that no longer exists.

Option 3 is now technically possible because the endpoint allows any origin, but the route still earns its place: it turns a `500` into a clear message, keeps the id and the host under our control, and means the feature does not break the day the header changes. The whitelist is what makes an import predictable when tweakcn adds a field; without it, a future key would either be merged blindly or dropped silently.

## Feature design

**Import and export surface**:

| Action | Input | Output | Failure |
|---|---|---|---|
| Export preset | current config | registry item JSON | none |
| Import JSON | pasted text | parsed theme, ignored keys, errors | readable message, no change |
| Import link | a tweakcn theme URL | the same parsed theme | route error, no change |
| Confirm | parsed theme | stored config | cancel keeps current |

**Field authority**:

| Field group | Authoritative location | Ignored duplicate |
|---|---|---|
| fonts, radius, tracking scale | `cssVars.theme` | `light` and `dark` copies, reported |
| colours, spacing, six shadow parameters | `cssVars.light`, `cssVars.dark` | none |
| derived shadows and `tracking-normal` | never read | `light` and `dark`, reported |
| `css` block | never applied | reported |

**Normalisation rules**:

| Input shape | Rule |
|---|---|
| colour | parse to oklch, re-serialise at three decimals for lightness and chroma, one for hue |
| radius | accept a number or a length, store as a rem string from the `theme` group |
| shadow numbers | accept `0.3` or `3px`, store the number with the documented unit |
| tracking | read the scale from `theme`, store `tracking-normal` as em |
| derived key | report, never apply |

**Error states**:

| Case | Message |
|---|---|
| JSON does not parse | "That is not valid JSON." |
| no `light` block | "A theme needs a light block." |
| colour does not parse | "`<key>` is not a colour this editor understands." |
| link id not safe | "That link does not contain a theme id." |
| editor URL | "That link does not contain a theme id. Use the theme page or its JSON endpoint." |
| link returns 500 or another status | "That theme id does not exist." |
| network failure | "That link could not be read. Paste the registry JSON instead." |

**Value sourcing**:

| Action | Value | Source |
|---|---|---|
| Export `name` | theme name | `config.theme` |
| Imported token | stored value | normalised from the input key of the same name |
| Ignored key list | key names | keys present in input and absent from the 44 key whitelist |
| Link theme id | id string | the segment after `/themes/` in a `tweakcn.com/themes/<id>` link, or between `/r/themes/` and `.json` in an endpoint link |
| Link existence | present or not | the HTTP status of `/r/themes/<id>.json` |

**Invariants**:
- An import either applies a complete parsed theme or changes nothing.
- Only one normaliser, used by both the JSON path and the link path.
- Every ignored key and the `css` block are shown; nothing is dropped silently.
- Derived keys are never read, even when a preset only carries them.
- No fixture, spec or doc contains a credential. A captured payload is scrubbed before it is written, never after.

**Security model**: the route takes one id, validates it against `[A-Za-z0-9_-]+`, and builds the fetch URL from the fixed host and the one fixed path. A pasted endpoint link is re-normalised to its id, never fetched as given, so the two accepted shapes cannot be turned into a wildcard. Redirects off host are refused, and it returns its own JSON. It never echoes the upstream body, so it cannot be used as an open proxy.

**Critical test scenarios**:
- Round trip: export, import, export, compare bytes, verifies **AC-1**, **AC-5**.
- Foreign preset: a captured tweakcn payload with the nine derived keys, the `css` block and a `theme` group imports with those keys listed and the colours applied, verifies **AC-2**, **AC-3**, **AC-4**.
- Fixture hygiene: the captured fixture returns no match for `token=`, verifies **AC-10**.
- Failure: paste malformed JSON, and request an unknown id, verifies **AC-6**, **AC-8**.
- Link shapes: a theme page link and an endpoint link resolve to the same id, and an editor link is rejected, verifies **AC-8**.
- Cancel: parse a valid preset and cancel, the theme is unchanged, verifies **AC-7**.
- Proxy guard: request the route with another host or an id containing a slash, it is rejected, verifies **AC-9**.

## Build plan

Carried in from 0005 and now landed before this slice's tasks: the `buildThemeCss` guard, the `src/registry/colors.ts` deletion and the AC-13 throw test. The test is what makes the guard meaningful here, because a partial imported preset is exactly the input that produces `--token: undefined;`.

1. Pin the route constants from the contract recorded above (host, path shape, id character set, status meanings) and capture one real payload as a fixture, stripping every token query value before it is saved, then search the file for `token=` and confirm none remains, satisfies **AC-8**, **AC-10**.
2. Write `exportThemeItem(config)` next to the generator, satisfies **AC-1**.
3. Write the parser, the whitelist, the authority rule and the normaliser, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.
4. Add the import dialog with paste, preview, ignored key list and confirm, satisfies **AC-7**.
5. Add the route with the id check for both accepted link shapes, the fixed host and path, the status mapping and the no redirect rule, satisfies **AC-8**, **AC-9**.
6. Add the round trip, captured payload, failure and proxy guard tests, then run `npm test` and the build, satisfies **AC-5**, **AC-6**, **AC-9**.

## Consequences

**Positive**:
- A theme can move between tweakcn and this editor without loss for supported fields, and the built-in presets come through the same path.
- Foreign presets fail loudly instead of producing a nearly right theme.

**Negative / tradeoffs**:
- The feature depends on tweakcn keeping the `/r/themes/<id>.json` path and its status semantics. The route isolates the client from that, not the feature.
- Normalisation means the first export of a foreign preset can differ textually from the source even when the visible result is the same.

**Neutral**:
- The ignored key report is the only place a newer tweakcn field will surface; if tweakcn adds many fields, that list becomes the backlog.
- A preset browser becomes a UI shell over this import path, not separate work.

## Migration plan

**Strategy**: in place, additive.
**Phases**:
1. Pin the contract constants and the export function.
2. Parser, whitelist and normaliser.
3. Dialog and route.
**Rollback**: revert the commit; no stored data changes shape.
**Risks**: the endpoint moving or changing status meanings, which shows up as the "does not exist" message rather than a broken theme, and a captured payload that drifts from the live one, caught by the recorded fixture.

## Follow-up

- [ ] A preset browser for the built-in tweakcn themes is a UI shell over this import path; the scope defers it, and it should not be built as a second fetcher.
- [ ] Revisit the model and the nine key whitelist when tweakcn adds or renames fields, using the ignored key report as the input.
- [ ] Runtime syntax colouring in the export dialog stays out of scope; the plain monospaced display is accepted.
