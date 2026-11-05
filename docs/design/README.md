# Design index

- [DESIGN.md](DESIGN.md) — observed visual baseline and opinionated preview-first direction, with concrete layout/type/color/motion values.
- [CURRENT-UX-FINDINGS.md](CURRENT-UX-FINDINGS.md) — ten ranked, evidenced problems with screenshot, source file and proposed fix.
- [COMPONENTS.md](COMPONENTS.md) — shadcn.io registry comparison and adoption decision for four existing primitives.
- [shots/](shots/) — running-app evidence: home at 390/768/1440px in both modes, plus open customizer at 390 and 1440px in light mode. Captures show the initial viewport, not the full page.

## Folder rules

Keep visual truth here: design tokens, composition and component-sourcing decisions, state/viewport specifications, accessibility rationale, and dated evidence of visual QA. Name screenshots by width, app mode and state (`390-light-customizer.png`). Record both observation and the exact app code responsible before recommending a change; distinguish screenshot framing from actual clipping. Add a `COMPONENTS.md` only when sourcing primitives, with registry reference and adoption rationale. Do not put product scope/specs, implementation code, generic brand prose or unverified claims here. Changes to existing app flow belong with Forge, using a design note that identifies files and states.
