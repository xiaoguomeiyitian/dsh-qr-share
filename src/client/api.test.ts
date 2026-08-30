/**
 * Tests for `fetchShareInfo` — the client-side wrapper around the host
 * `/_qr/share` route.
 *
 * Strategy: stub `globalThis.fetch` so we don't hit a real server. The
 * three branches we care about are:
 *
 *   1. 200 + valid JSON   → ShareInfo echoed back
 *   2. 401 / 403 / 5xx     → null  (caller hides the button)
 *   3. network throws      → null  (treated identically to non-2xx)
 *
 * We also probe the AbortSignal plumbing and the malformed-JSON guard.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchShareInfo } from './api.ts'

type FetchMock = ReturnType<typeof vi.fn>

describe('fetchShareInfo', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the parsed payload on a 200 + valid JSON body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ready: true, token: 'tok-abc', tokenTtlMs: 86_400_000 }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const info = await fetchShareInfo()
    expect(info).toEqual({ ready: true, token: 'tok-abc', tokenTtlMs: 86_400_000 })
  })

  it('treats !ready as a success-shaped payload (caller hides button via ready)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ready: false, token: '', tokenTtlMs: 0 }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    const info = await fetchShareInfo()
    expect(info).toEqual({ ready: false, token: '', tokenTtlMs: 0 })
  })

  it('returns null on 401 (unauthenticated)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('qr-share: authentication required\n', { status: 401 }))
    expect(await fetchShareInfo()).toBeNull()
  })

  it('returns null on 403 (host not trusted)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('qr-share: forbidden\n', { status: 403 }))
    expect(await fetchShareInfo()).toBeNull()
  })

  it('returns null on 5xx (server error)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 503 }))
    expect(await fetchShareInfo()).toBeNull()
  })

  it('returns null when fetch rejects (network down, CORS, etc.)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect(await fetchShareInfo()).toBeNull()
  })

  it('returns null on 200 + malformed JSON (missing required keys)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ready: true /* token missing */ }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    expect(await fetchShareInfo()).toBeNull()
  })

  it('coerces a non-number tokenTtlMs to 0', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ready: true, token: 'tok-x', tokenTtlMs: 'forever' }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    const info = await fetchShareInfo()
    expect(info?.tokenTtlMs).toBe(0)
    expect(info?.token).toBe('tok-x')
    expect(info?.ready).toBe(true)
  })

  it('always uses same-origin credentials and no-store cache', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ready: true, token: 't', tokenTtlMs: 1 }), { status: 200 }),
    )
    await fetchShareInfo()
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(init?.credentials).toBe('same-origin')
    expect(init?.cache).toBe('no-store')
    expect(init?.headers).toMatchObject({ accept: 'application/json' })
  })

  it('forwards an AbortSignal when one is supplied', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ready: true, token: 't', tokenTtlMs: 1 }), { status: 200 }),
    )
    const ac = new AbortController()
    await fetchShareInfo(ac.signal)
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(init?.signal).toBe(ac.signal)
  })

  it('omits the signal key when no signal is supplied (no AbortController allocation in prod)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ready: true, token: 't', tokenTtlMs: 1 }), { status: 200 }),
    )
    await fetchShareInfo()
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(init).not.toHaveProperty('signal')
  })
})