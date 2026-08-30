/**
 * Tests for the QrDialog component.
 *
 * Coverage:
 *   - renders the title + URL block + Close button when given a token
 *   - the canvas element exists with the configured width/height
 *   - the URL is composed as `${origin}/?token=...`
 *   - Escape key invokes onClose
 *   - clicking the backdrop invokes onClose
 *   - clicking inside the dialog does NOT invoke onClose
 *
 * qrcode.toCanvas is mocked (it touches a real canvas 2D context we
 * don't have in happy-dom) so we only assert the dialog shape, not the
 * QR pixel rendering.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { QrDialog } from './QrDialog.tsx'
import type { QrDialogProps } from './QrDialog.tsx'

// qrcode renders to a real <canvas> 2D context happy-dom doesn't ship;
// stub it to a no-op so we can assert the surrounding DOM only.
vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn(() => Promise.resolve()),
  },
}))

const noopT = ((k: string) => k) as unknown as QrDialogProps['t']

const baseProps: QrDialogProps = {
  token: 'tok-123',
  tokenTtlMs: 86_400_000,
  t: noopT,
  onClose: vi.fn(),
}

describe('QrDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders title, URL block and Close button when given a token', () => {
    const { getByText, getByRole } = render(<QrDialog {...baseProps} />)
    expect(getByText('dialog.title')).toBeInTheDocument()
    expect(getByText('dialog.urlLabel')).toBeInTheDocument()
    expect(getByText('dialog.hint')).toBeInTheDocument()
    expect(getByRole('button', { name: 'dialog.close' })).toBeInTheDocument()
  })

  it('composes the URL as `${window.location.origin}/?token=…`', async () => {
    const { findByText } = render(<QrDialog {...baseProps} />)
    const expected = `${window.location.origin}/?token=tok-123`
    expect(await findByText(expected)).toBeInTheDocument()
  })

  it('renders a canvas at the configured 256x256 size', () => {
    render(<QrDialog {...baseProps} />)
    // The dialog is portaled into document.body, so the canvas is not a
    // descendant of the render() container; query the document directly.
    const canvas = document.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.getAttribute('width')).toBe('256')
    expect(canvas?.getAttribute('height')).toBe('256')
  })

  it('invokes onClose when the Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<QrDialog {...baseProps} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT invoke onClose on non-Escape keys', () => {
    const onClose = vi.fn()
    render(<QrDialog {...baseProps} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    fireEvent.keyDown(window, { key: 'a' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('invokes onClose when the backdrop (not the dialog body) is clicked', () => {
    const onClose = vi.fn()
    const { getByRole, getByText } = render(<QrDialog {...baseProps} onClose={onClose} />)
    const dialog = getByRole('dialog')
    const title = getByText('dialog.title')

    // Clicking inside the dialog must not close
    fireEvent.click(title)
    expect(onClose).not.toHaveBeenCalled()

    // Clicking on the dialog itself must not close (the e.target !== currentTarget guard)
    fireEvent.click(dialog)
    expect(onClose).not.toHaveBeenCalled()

    // Clicking on the backdrop (the parent presentation div) must close
    const backdrop = dialog.parentElement
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('invokes onClose when the Close button is clicked', () => {
    const onClose = vi.fn()
    const { getByRole } = render(<QrDialog {...baseProps} onClose={onClose} />)
    fireEvent.click(getByRole('button', { name: 'dialog.close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})