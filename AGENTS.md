# shadcn/ui Customizer

## Stack

- **Language / Runtime**: TypeScript 5.1, Node 20 or newer
- **Framework**: Next.js 14.2 (App Router), React 18.2
- **Key dependencies**: Tailwind CSS 4.3.4, with theme tokens stored as complete `oklch()` values in `src/registry/themes.ts` and `src/app/globals.css` and mapped through `@theme inline` · Jotai for the config atom · Radix UI primitives · react-color for pickers
- **Package manager**: npm with `package-lock.json`

## Build approach

Tracer Bullet: each slice ends with a running app that renders and exports a working theme.

## Commands

```bash
npm install      # install, npm only
npm run dev      # dev server on port 3003
npm run build    # production build
npm run lint     # eslint
npm test         # vitest, added by spec 0002 and absent before it
```

## Local setup

`.env.local` needs `SHADCNIO_TOKEN` plus placeholder values for `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `RESEND_API_KEY`, because `src/app/(app)/api/unsubscribe/route.ts` builds a Redis client at module load and page data collection touches it. The placeholders are not credentials: subscribe and unsubscribe do not work locally, and no placeholder value is written into this file. Do not make those routes env optional as part of a migration slice; that is a separate app change. Real credentials, when they arrive, go in `.env.local` and nowhere else.

## Specs

Stored in `docs/specs/`, numbered `NNNN-title.md`. The scope is `docs/scope/scope.md`.

## Git

- integration: off
- remotes: `origin` is the Railly upstream, `verbose-fortnight` is the user's own repo. Change neither and push to neither without the user.

## Component sourcing

- The primary component library is shadcn.io. Discovery goes through the `shadcn-io` MCP server, which every agent has, and installs go through the `@shadcnio` registry entry in `components.json`.
- The registry needs a free account token. Put it in `.env.local` as `SHADCNIO_TOKEN`, never in `components.json`, a URL, or a commit. `.env.example` carries the name with an empty value.
- `src/registry/` keeps the vendored copies of the existing 47 components until the class pass in spec 0003 finishes. Anything new comes from the registry instead of being hand written.

## Rules

- The theme is a set of semantic CSS variables. Defaults live in `src/app/globals.css` and preset values in `src/registry/themes.ts`, and every colour token is a complete `oklch()` value. Never add a second representation of a token.
- `buildThemeCss` in `src/registry/theme-export.ts` is the only producer of exported CSS. Do not emit CSS from JSX.
- Component sources exist in `src/components/ui`, both styles under `src/registry`, and as strings in `src/__registry__/index.tsx`. They are related but not identical; diff before assuming.
- Style with utility classes merged through `cn()` in `src/lib/utils.ts`. No CSS modules.
- Import with the `@/*` alias for `src/*`.
- Ownership: `docs/design/` is Prism's, `docs/reviews/` and test content are Verity's, `docs/scope/` and `docs/specs/` are Atlas's. Do not edit another owner's files.
- Dependencies: npm only, never bun. Add one only when a spec calls for it.
- This is a public demo: no accounts, no stored user data, no server database.
- The customizer has two presentations: a popover panel at md and above, and a vaul drawer below it. They are deliberate, so do not treat one as a broken version of the other or resize the viewport to match.

## Context files

- [src/registry/AGENTS.md](src/registry/AGENTS.md): vendored components, examples, blocks and the generated mirror

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
