# dsh-qr-share

English | [中文](README.zh.md)

> DSH web plugin: a sidebar-footer QR-code button that lets a phone scan
> and re-issue the current browser's authenticated launch URL, reusing the
> same `?token=…` exchange the desktop just completed.

[![license](https://img.shields.io/github/license/xiaoguomeiyitian/dsh-qr-share)](LICENSE)
[![version](https://img.shields.io/github/v/release/xiaoguomeiyitian/dsh-qr-share)](https://github.com/xiaoguomeiyitian/dsh-qr-share/releases)
[![stars](https://img.shields.io/github/stars/xiaoguomeiyitian/dsh-qr-share?style=social)](https://github.com/xiaoguomeiyitian/dsh-qr-share/stargazers)
[![dsh.so](https://www.dsh.so/badge/dsh-qr-share.svg)](https://www.dsh.so/artifact/dsh-qr-share)
![dsh](https://img.shields.io/badge/DSH-0.1.0--rc.8%20%7C%200.1.2--alpha.1-8257D0)

## Screenshots

> Placeholder — add a screenshot of the sidebar footer button + dialog to
> `docs/screenshot.png` and uncomment the line below. Recommended size:
> 640×400, capturing the bottom of the sidebar and the QR dialog.

<!-- ![QR button + dialog](docs/screenshot.png) -->

## What it does

1. After login, a QR-code icon appears in the sidebar footer (next to
   the Settings trigger).
2. Click → a dialog opens showing a QR code and the resolved URL as
   plain text (fallback for failed scans).
3. Scan with a phone → the phone opens the URL → the server's
   `BrowserAuth` exchanges the token for a cookie (303 → `/`) and the
   phone lands on the same session.

The QR URL is composed from `window.location.origin` so it automatically
matches whatever authority the desktop actually used (LAN IP, public
domain, reverse-proxied sub-path). **No environment variable is needed
for the QR to point at the right host** — the `DSH_PUBLIC_HOST` already
in `web-external.patch.yml` still gates the route via the trust fence.

## Security model

- The `/_qr/share` route is gated by `connection.requestRejection` —
  identical to `/api`'s gate. 403 if Host isn't trusted; 401 if the
  browser cookie isn't valid. The token is only returned on 200.
- The launch token is process-stable (one per `dsh web` activation) and
  becomes useless after the first exchange (the cookie is bound to the
  authority and HttpOnly + SameSite=Strict).
- `SameSite=Strict` + same-origin `fetch` mean the route is unreachable
  from any cross-site frame.

## Install

### Via the DSH plugin CLI (recommended for production)

```bash
dsh plugin --profile <name> add dsh-qr-share@latest
```

This adds the bundle declaration to your profile and reuses the
`cordis.patch.yml` shipped in the package — no manual patch overlay
edits needed.

### Via plain `npm install`

```bash
# in a project that owns a DSH profile directory
npm install dsh-qr-share
# or with pnpm
pnpm add dsh-qr-share
```

Then add the row from `cordis.patch.yml` (shipped with the package) to
your profile's patch overlay, and ensure the package is reachable from
the profile's `node_modules` (pnpm/npm flat layout works; pnpm strict
layout needs a symlink — see `manual` install below).

### Manual install (e.g. inside the docker-build image)

1. Place the package at `/app/dsh-qr-share/`.
2. Symlink it into `$DSH_HOME/profiles/node_modules/dsh-qr-share` (the
   entrypoint does this for you; see `docker-build/docker-scripts/entrypoint.sh`).
3. Add the row from `cordis.patch.yml` to your patch overlay:

   ```yaml
   - insert:
       - id: qr-share
         name: 'dsh-qr-share'
   ```

## Configuration (patch overlay)

```yaml
- insert:
    - id: qr-share
      name: 'dsh-qr-share'
      config:
        enabled: true   # default true; set false to short-circuit the route to 404
```

## Build

```bash
pnpm install
pnpm build       # tsc declarations + tsdown bundles
pnpm typecheck   # strict check
pnpm pack        # produce dsh-qr-share-<version>.tgz (used by the install commands above)
```

Outputs:

- `lib/index.js` — Node host half (the `/_qr/share` route)
- `lib/invariant.js` — runtime guard
- `lib/client.js` — official profile channel bundle (id `dsh-qr-share`)
- `lib/client-registry.js` — plugin-registry channel bundle (id `dsh-external/dsh-qr-share`)
- `lib/types/**` — TypeScript declarations

## Compatibility

- Node `>=20`
- DSH (DeepSeek Harness) core `>=0.1.0-rc.8` (tested against
  `0.1.1-rc.2` and `0.1.2-alpha.1`)
- React `^18 || ^19` (peer, optional — the host half doesn't need React)

The host half uses `@deepseek-ai/cordis` **types only** (declaration
merging + `Context` re-export); the runtime cordis instance is supplied
by the DSH core at plugin mount time. This is why the peer dependency
on `@deepseek-ai/cordis` is intentionally absent — it would be rejected
by the DSH market manifest gate, and is not required at runtime.

## Publishing

For maintainers — see [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md) for
the step-by-step `npm publish` flow.

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgements

- [`dsh-better-sidebar`](https://github.com/omdsh-dev/DSH-better-sidebar) — the
  slot injection and dual client bundle (official / plugin-registry) pattern
  is inspired by its `tsdown.config.ts`.
- [`qrcode`](https://www.npmjs.com/package/qrcode) — the QR code renderer.
- DSH community — for the `dsh.community` plugin manifest spec
  (`0.15`) and the verification / discovery surface at
  [dsh.so](https://www.dsh.so).
