# Changelog

All notable changes to **dsh-qr-share** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] — 2026-08-30

### Added

- **Copy link button in the dialog** — a second footer action next to
  Close. Clicking it copies `${window.location.origin}/?token=…` to
  the clipboard; the label flips to a localized "已复制 / Copied"
  confirmation for 1.5 s, then back. Falls back from the async
  Clipboard API to `document.execCommand('copy')` when the secure-
  context path is unavailable (older WebViews, non-HTTPS previews),
  and surfaces "复制失败 / Copy failed" if both paths reject.
- **Extra locale dictionaries** — beyond the built-in `zh` and `en`,
  six more locales are registered via the single-locale
  `ctx.locale.register(ns, locale, dict)` overload: `zh-Hant` (繁體),
  `ja`, `ko`, `fr`, `de`, `ru`. They activate only when a matching
  language-pack plugin sets the DSH preference; without a language
  pack, the existing fallback chain (`zh` → `en`) still resolves.
- **Dialog keys for the copy flow** — `dialog.copy`, `dialog.copied`,
  and `dialog.copyFailed` added to the `QrShareKey` interface and
  every dictionary.
- **Two QrDialog tests** — clipboard write is asserted with a
  stubbed `navigator.clipboard.writeText` (success + reject path).

### Changed

- **Footer action row** in `QrDialog` now holds two buttons
  ("Copy link" + "Close") in a flex row (`.actions`) instead of a
  single Close button. The `.close` class is generalized to `.action`;
  the dialog's visual rhythm is unchanged.

## [0.2.0] — 2026-08-30

### Added

- **Test infrastructure** — vitest 2 + @testing-library/react, configured
  for happy-dom. `pnpm test` runs 27 specs covering `config`,
  `client/api` and `client/QrDialog`. `tsconfig.build.json` now
  excludes `src/**/*.test.ts(x)` and `src/test/**` so the tests never
  reach the published `.d.ts` output.
- **Ambient CSS module declaration** — `src/client/styles.module.css.d.ts`
  gives `tsc` the default-export shape that `lightningcss` produces at
  build time, unblocking `import styles from './styles.module.css'`
  in `QrButton.tsx` and `QrDialog.tsx` without weakening the type
  checker.

### Changed

- **Dialog now renders into `document.body` via `createPortal`** —
  the sidebar's `transform`/`filter` would otherwise trap
  `position: fixed` inside the sidebar's box; portalling escapes every
  ancestor's containing block so the backdrop covers the viewport and
  the dialog is centered on screen.
- **Dialog surface is theme-aware and fully opaque** — background
  resolves to the DSH shell's `--dsw-alias-bg-layer-1` token (alpha = 1),
  with a `currentColor 12%` hairline border and a soft shadow. A
  `--dsh-qr-share-dialog-bg` override hook is exposed for power users.
- **QR code canvas wrapped in a white card** — 8px padding + `#fff`
  background guarantees the black modules stay scannable against
  either light or dark DSH surface.
- **Sidebar action is now a labeled icon** — wide mode renders both
  the `HiOutlineQrCode` icon and the `button.label` text; rail mode
  keeps the icon only.
- **Copy localized** — `button.label` is now "分享" (zh) / "Share"
  (en); `button.tooltip` and `dialog.title` were rewritten in the
  same voice ("扫码把当前会话分享到手机" / "Scan to share"). The host
  handshake's semantics are unchanged.

### Fixed

- **QR canvas was blank on first render** — the `useEffect` that
  calls `qrcode.toCanvas` ran once before the portal-mounted `<canvas>`
  was in the DOM. Adding `portalTarget` to the effect's dependency
  list gives the canvas a second pass after the portal resolves.
- **CSS Module class names were hardcoded** — `QrDialog.tsx` and
  `QrButton.tsx` used the literal `'dsh-qr-share-backdrop'`
  strings, but tsdown's `lightningcss` compiles them under the
  `[hash]_[local]` pattern (`i2jIGq_backdrop`). The two forms never
  matched, so the dialog had no styles at all and fell back to
  `position: static`. Both files now consume the `styles.*` import
  map; the bundle ships the hashed class names in the inline
  `<style data-plugin>` tag.

## [0.1.0] — 2026-08-29

### Added

- **Host half** (`lib/index.js`) — registers `/_qr/share` HTTP route via
  `ctx.webServer.register`. The route is gated by `connection.requestRejection`
  (same trust fence as `/api`): 403 if Host is not in `trustedHosts`,
  401 if the browser cookie is missing/expired, 200 only when both pass.
  On success it returns `{ ready, token, tokenTtlMs }` so the client can
  compose `${window.location.origin}/?token=${token}` without any
  environment variable coupling.
- **Client half** (`lib/client.js` + `lib/client-registry.js`) — registers a
  `sidebar.footer.action` slot occupant. The button stays mounted but
  hidden until the host reports `ready: true`; clicking it opens a dialog
  showing the QR code (`qrcode` lib) and the resolved URL as plain text
  fallback.
- **Locale dictionaries** — `betterSidebar` namespace, `zh` and `en` translations
  for button title and dialog copy.
- **Two client bundles** — official profile channel (`lib/client.js`,
  id `dsh-qr-share`) and plugin-registry channel (`lib/client-registry.js`,
  id `dsh-external/dsh-qr-share`); both ship the same source compiled with
  only the registered id and output filename differing.
- **Type-only `Context` augmentations** — `declare module '@deepseek-ai/cordis'`
  carries the minimal slices (`locale`, `slots`, `connection`, `webServer`)
  we use; no runtime value import of cordis, the runtime instance is
  supplied by the DSH core.
- **`cordis.patch.yml`** — single `insert` row that the official
  `dsh plugin --profile <name> add dsh-qr-share@<version>` reconciles
  into `dsh.profile.bundles` automatically.

### Security

- The `/_qr/share` route only returns the launch token after passing the
  same `connection.requestRejection` gate as `/api` — identical 401/403
  status codes, identical minimal text body shape, no JSON leak about
  which check tripped.
- The launch token is process-stable (one per `dsh web` activation) and
  becomes useless after the first exchange (the cookie is bound to the
  authority and HttpOnly + SameSite=Strict).
- The client uses `credentials: 'same-origin'` and `cache: 'no-store'`,
  preventing cross-site frames from reaching the route and stopping
  intermediary caches from storing the token.

[Unreleased]: https://github.com/xiaoguomeiyitian/dsh-qr-share/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/xiaoguomeiyitian/dsh-qr-share/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/xiaoguomeiyitian/dsh-qr-share/releases/tag/v0.1.0
