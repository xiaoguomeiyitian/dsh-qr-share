/**
 * dsh-qr-share host half.
 *
 * Exposes `/_qr/share` (exact HTTP route) to authenticated browsers. The
 * response carries the fresh process launch token; the browser then
 * composes the final URL as `${window.location.origin}/?token=${token}`
 * so the QR code automatically follows whatever authority the desktop
 * actually used (LAN IP, public domain, reverse-proxied sub-path on a
 * port-80 host, etc.) — no DSH_PUBLIC_HOST coupling.
 *
 * Security: every request passes through `connection.requestRejection`,
 * which applies the same trust fence as the /api gateway:
 *   - 403 if Host is not in `trustedHosts` (LAN literals + --trusted-host)
 *   - 401 if the browser cookie is missing/expired (i.e. not yet logged in)
 * The token is only returned when both checks pass; the same code path
 * also drives the client-side `ready` flag so the button is hidden until
 * the user is actually authenticated.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { assertNodeContext } from './invariant.ts'
import { resolveConfig, type ResolvedConfig } from './config.ts'
import type { Context } from './context-types.ts'

export const name = 'dsh-qr-share'
export { resolveConfig }
export type { ResolvedConfig } from './config.ts'

/** Required services from the cordis fiber. */
export const inject = ['connection', 'webServer'] as const

/**
 * The exact HTTP route name. Hard-coded so the plugin self-documents and
 * a misconfigured patch never silently mounts under a wrong path.
 */
const ROUTE_PATH = '/_qr/share'

/** Wall-clock approximate TTL of the browser cookie — purely advisory. */
const ADVISORY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

/** Resolve the launch token from the live BrowserAuth, given a request. */
function resolveToken(ctx: Context, hostHeader: string): string {
  const baseUrl = `http://${hostHeader}`
  const launchUrl = ctx.connection.authenticatedUrl(baseUrl)
  const token = new URL(launchUrl).searchParams.get('token')
  return token ?? ''
}

/**
 * Mount the route and return the disposer. Plugin fiber disposal removes
 * it via the webServer's own bookkeeping.
 * @param ctx - host cordis context (connection + webServer injected).
 * @param rawConfig - patch-time config (validated by resolveConfig).
 */
export function apply(ctx: Context, rawConfig: unknown): void {
  assertNodeContext()
  const config = resolveConfig(rawConfig)
  if (!config.enabled) return

  const connection = ctx.connection
  const webServer = ctx.webServer

  webServer.register({
    kind: 'exact',
    path: ROUTE_PATH,
    handler: (req: IncomingMessage, res: ServerResponse): void => {
      // Trust + auth gate. Returns the rejection status (401/403) or undefined.
      const rejection = connection.requestRejection(req)
      if (rejection !== undefined) {
        // Match /api's minimal response shape: status + plain text body.
        // No JSON leak about which check tripped.
        res.writeHead(rejection, {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
        })
        res.end(
          rejection === 401
            ? 'qr-share: authentication required\n'
            : 'qr-share: forbidden\n',
        )
        return
      }

      // Use req.headers.host (the authority the browser actually used).
      // Trust fence has just approved it, so we don't risk SSRF here.
      const hostHeader = req.headers.host
      if (typeof hostHeader !== 'string' || hostHeader === '') {
        res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('qr-share: missing Host header\n')
        return
      }

      const token = resolveToken(ctx, hostHeader)
      const ready = token !== ''

      const body = JSON.stringify({
        ready,
        token,
        tokenTtlMs: ADVISORY_TOKEN_TTL_MS,
      })
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      })
      res.end(body)
    },
  })
}
