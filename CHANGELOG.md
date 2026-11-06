# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The theme editor covers the full tweakcn parameter set: data colours `chart-1` to `chart-5`, the sidebar colour set, three font stacks, letter spacing, spacing and six shadow values, each with a control that shows its value and a specimen in the preview. The chart specimen is the shadcn.io chart component, and the chart series in the example blocks now paint from the same tokens (see spec 0005).
- Themes can be imported from and exported to tweakcn, by pasting a preset's registry JSON or a `themes/<id>` link. Import reports the values this editor cannot represent instead of dropping them silently, and a share link is resolved by the app's own server route rather than the browser (see spec 0006).
- `npm test` now runs a Vitest suite, with a fixture that pins the exported CSS so a change to the generator shows up as a diff instead of drifting quietly (see spec 0002).

### Changed

- The build moved to Tailwind 4.3.4 with npm, using `@tailwindcss/postcss` and `tw-animate-css`. `tailwind.config.js` and the bun lockfile are gone, and the theme is expressed in CSS through `@theme inline` (see spec 0001).
- Component classes follow Tailwind 4 meaning: focus outlines use `outline-hidden`, important modifiers use the trailing `!`, and gradients use `bg-linear-*`. The class merge library is on 3.7.0. Tailwind 4's default radius, shadow, blur and ring scales are taken as they come, so some controls and cards look slightly different (see spec 0003).
- Theme export now produces Tailwind 4 CSS: the two imports, a `dark` custom variant, `:root` and `.dark` token blocks, and an `@theme inline` map, with every colour written as a complete `oklch()` value instead of an HSL triplet (see spec 0004).
- The editor shows exactly the CSS it copies, because the header copy action and the dialog read from one export function. That function throws when a token is missing, so a broken theme fails loudly instead of exporting `undefined` (see spec 0004).
- The default tokens in `src/app/globals.css` now follow the zinc preset, so the page chrome moves from the previous blue grey tint to a neutral one (see spec 0004).
- Themes saved in the browser before this change are dropped, because the stored config moved to the `config-v2` key (see spec 0004).

### Removed

- The Tailwind 3 HSL export and the second, hand built export renderer are gone. One export path remains, and it emits Tailwind 4 CSS (see spec 0004).

### Fixed

- Preset exports no longer produce `--radius: 0.5remrem`. Radius is stored as a complete length everywhere, so no code appends a second unit (see spec 0004).
- Dark mode `--ring` is a valid colour again, and the zinc light `--popover` value no longer carries a stray semicolon (see spec 0004).
- Importing a tweakcn preset now takes fonts and radius from the theme block instead of quietly preferring the light block. A partial preset is refused with the missing keys named, rather than applied and exported as broken CSS, and non string values are rejected. When a payload has no `letter-spacing` value, letter spacing comes from the tracking scale. The confirm step shows colour swatches before you apply (see spec 0006).
- The share link route refuses a response larger than 256 KB, before parsing, so an oversized payload fails with a clear error instead of being read (see spec 0006).
