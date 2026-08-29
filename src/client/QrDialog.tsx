/**
 * QR-code modal: a fixed-position overlay with a canvas, the resolved URL
 * as plain text (so the user can type it manually if scanning fails), and
 * a Close button. The URL is composed from `window.location.origin` —
 * not from the host — so it always matches whatever authority the
 * desktop just used to reach this page.
 *
 * Server-side constraint: BrowserAuth.authorizeIndex only accepts token
 * exchanges on path `/` (see browser-auth.ts). We enforce that here so a
 * future reverse-proxy sub-path does NOT silently produce a 401 on the
 * phone.
 */
import { createElement, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import QRCode from 'qrcode'
import { LOCALE_NS } from './locales.ts'

export interface QrDialogProps {
  token: string
  tokenTtlMs: number
  t: (key: keyof typeof import('./locales.ts').zh) => string
  onClose: () => void
}

function composeQrUrl(token: string): string {
  // URL API handles trailing slashes / port-less origins cleanly; the
  // resulting href is always of the form `${origin}/?token=...`.
  const url = new URL('/', window.location.origin)
  url.searchParams.set('token', token)
  return url.toString()
}

export function QrDialog({ token, tokenTtlMs, t, onClose }: QrDialogProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [payload, setPayload] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token === '') return
    const url = composeQrUrl(token)
    setPayload(url)
    const canvas = canvasRef.current
    if (canvas !== null) {
      void QRCode.toCanvas(canvas, url, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
        color: { dark: '#000000', light: '#ffffff' },
      }).catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : String(reason))
      })
    }
  }, [token])

  // Silence unused-var: tokenTtlMs is part of the public surface; the
  // dialog could render a "expires in Nh" line in the future.
  void tokenTtlMs

  // Escape + backdrop dismiss. The dialog is rendered above the sidebar
  // (fixed position) so the user expects the same UX as other DSH modals.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const onBackdropClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose()
  }

  return createElement('div', {
    className: 'dsh-qr-share-backdrop',
    role: 'presentation',
    onClick: onBackdropClick,
  },
    createElement('div', {
      className: 'dsh-qr-share-dialog',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'dsh-qr-share-title',
    },
      createElement('h2', { id: 'dsh-qr-share-title', className: 'dsh-qr-share-title' },
        t('dialog.title')),
      error !== null
        ? createElement('p', { className: 'dsh-qr-share-err' }, `${t('dialog.error')}: ${error}`)
        : createElement('canvas', {
            ref: canvasRef,
            className: 'dsh-qr-share-canvas',
            width: 256,
            height: 256,
          }),
      createElement('div', { className: 'dsh-qr-share-url-block' },
        createElement('span', { className: 'dsh-qr-share-url-label' }, t('dialog.urlLabel')),
        createElement('code', { className: 'dsh-qr-share-url' }, payload),
      ),
      createElement('p', { className: 'dsh-qr-share-hint' }, t('dialog.hint')),
      createElement('button', {
        type: 'button',
        className: 'dsh-qr-share-close',
        onClick: onClose,
      }, t('dialog.close')),
    ),
  )
}

void LOCALE_NS
