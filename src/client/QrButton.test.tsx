/**
 * Tests for the QrButton component.
 *
 * Coverage:
 *   - the trigger button renders; the dialog stays closed until a click
 *   - opening the dialog re-fetches the share info and encodes the FRESH
 *     token (a copy cached before a Host restart must not be reused)
 *   - a failed re-fetch falls back to the probed `info` payload
 *   - while the dialog stays open the token is re-fetched on the interval
 *   - closing the dialog stops the re-fetch loop
 *
 * qrcode.toCanvas is mocked (it touches a real canvas 2D context happy-dom
 * doesn't ship) and ./api.ts is mocked so the tests observe fetch timing
 * instead of network behavior.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { QrButton } from './QrButton.tsx'
import type { QrButtonProps } from './QrButton.tsx'
import { fetchShareInfo } from './api.ts'

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('./api.ts', () => ({
  fetchShareInfo: vi.fn(() => Promise.resolve(null)),
}))

const noopT = ((k: string) => k) as unknown as QrButtonProps['t']

const probedInfo: QrButtonProps['info'] = {
  token: 'tok-probed',
  tokenTtlMs: 86_400_000,
}

function baseProps(overrides: Partial<QrButtonProps> = {}): QrButtonProps {
  return { info: probedInfo, wide: false, t: noopT, ...overrides }
}

function openDialog(): void {
  fireEvent.click(document.querySelector('button') as HTMLButtonElement)
}

describe('QrButton', () => {
  beforeEach(() => {
    vi.mocked(fetchShareInfo).mockResolvedValue(null)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders the trigger button and keeps the dialog closed until clicked', () => {
    render(<QrButton {...baseProps()} />)
    expect(document.body.textContent).not.toContain('dialog.title')
    openDialog()
    expect(document.body.textContent).toContain('dialog.title')
  })

  it('re-fetches on open and encodes the fresh token, not the probed one', async () => {
    vi.mocked(fetchShareInfo).mockResolvedValue({
      ready: true,
      token: 'tok-fresh',
      tokenTtlMs: 86_400_000,
    })
    render(<QrButton {...baseProps()} />)
    openDialog()
    expect(fetchShareInfo).toHaveBeenCalledTimes(1)
    const expected = `${window.location.origin}/?token=tok-fresh`
    await waitFor(() => {
      expect(document.body.textContent).toContain(expected)
    })
    expect(document.body.textContent).not.toContain('tok-probed')
  })

  it('falls back to the probed payload when the re-fetch fails', async () => {
    vi.mocked(fetchShareInfo).mockResolvedValue(null)
    render(<QrButton {...baseProps()} />)
    openDialog()
    const expected = `${window.location.origin}/?token=tok-probed`
    await waitFor(() => {
      expect(document.body.textContent).toContain(expected)
    })
  })

  it('re-fetches on the interval while open and stops after close', async () => {
    vi.useFakeTimers()
    render(<QrButton {...baseProps()} />)
    openDialog()
    expect(fetchShareInfo).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(fetchShareInfo).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(fetchShareInfo).toHaveBeenCalledTimes(3)
    fireEvent.keyDown(window, { key: 'Escape' })
    await vi.advanceTimersByTimeAsync(30_000)
    expect(fetchShareInfo).toHaveBeenCalledTimes(3)
  })
})
