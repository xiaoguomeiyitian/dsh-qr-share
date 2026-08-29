# dsh-qr-share

DSH web plugin: a sidebar-footer QR-code button that lets a phone scan
and re-issue the current browser's authenticated launch URL, reusing the
same `?token=…` exchange the desktop just completed.

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

## Install (via CLI)

```bash
dsh plugin --profile <name> add dsh-qr-share@latest
```

## Install (manual, e.g. inside the docker-build image)

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
```

Outputs:

- `lib/index.js` — Node host half (the `/_qr/share` route)
- `lib/invariant.js` — runtime guard
- `lib/client.js` — official profile channel bundle (id `dsh-qr-share`)
- `lib/client-registry.js` — plugin-registry channel bundle (id `dsh-external/dsh-qr-share`)
- `lib/types/**` — TypeScript declarations
