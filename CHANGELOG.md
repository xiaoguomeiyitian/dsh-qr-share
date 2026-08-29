# Changelog

All notable changes to **dsh-qr-share** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/xiaoguomeiyitian/dsh-qr-share/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/xiaoguomeiyitian/dsh-qr-share/releases/tag/v0.1.0
