/**
 * Client-side wrapper around the host half's `/_qr/share` route. A single
 * GET; the browser's cookie is carried automatically (SameSite=Strict,
 * set by BrowserAuth at the same authority).
 *
 * Returns null on any non-2xx or network failure so the caller can treat
 * "not ready" and "still probing" identically.
 */

export interface ShareInfo {
  /** True when the server saw an authenticated browser AND produced a token. */
  ready: boolean
  /** Fresh launch token (process-stable; cookie-bound by Host once consumed). */
  token: string
  /** Advisory TTL displayed in the dialog — not enforced server-side. */
  tokenTtlMs: number
}

const ROUTE_PATH = '/_qr/share'

export async function fetchShareInfo(signal?: AbortSignal): Promise<ShareInfo | null> {
  try {
    const res = await fetch(ROUTE_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'accept': 'application/json' },
      ...(signal === undefined ? {} : { signal }),
    })
    if (!res.ok) return null
    const data = await res.json() as Partial<ShareInfo>
    if (typeof data.token !== 'string' || typeof data.ready !== 'boolean') return null
    return {
      ready: data.ready,
      token: data.token,
      tokenTtlMs: typeof data.tokenTtlMs === 'number' ? data.tokenTtlMs : 0,
    }
  } catch {
    return null
  }
}
