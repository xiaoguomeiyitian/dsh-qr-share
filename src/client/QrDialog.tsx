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
 *
 * Portal: the dialog is rendered into `document.body` via createPortal.
 * The shell's sidebar uses transforms/filters on its ancestors, which
 * would otherwise trap `position: fixed` inside the sidebar's box and
 * make the dialog appear *inside* the sidebar column. Portaling escapes
 * every ancestor's containing block so the backdrop covers the viewport
 * and the dialog is centered on screen.
 */
import { createElement, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { LOCALE_NS } from './locales.ts'
import styles from './styles.module.css'

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

/**
 * Write text to the clipboard. Prefers the async Clipboard API; falls
 * back to the legacy execCommand path for older WebViews / non-secure
 * contexts where navigator.clipboard is absent.
 */
async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard !== undefined) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to the legacy path — e.g. permission policy denial.
    }
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export function QrDialog({ token, tokenTtlMs, t, onClose }: QrDialogProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [payload, setPayload] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  // Resolve the portal target on mount. document.body exists in every
  // browser env we ship to; the effect runs once.
  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  useEffect(() => {
    // Wait until the portal target resolves; the <canvas> only mounts into
    // document.body *after* portalTarget flips. Without portalTarget in the
    // dep list, the effect runs once with canvasRef.current === null (the
    // portal-mounted canvas hasn't rendered yet) and never re-runs, so the
    // canvas stays blank. portalTarget is set in an earlier effect on the
    // same render, so listing it here triggers a second pass once the
    // canvas is actually in the DOM.
    if (portalTarget === null) return
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
  }, [token, portalTarget])

  // Silence unused-var: tokenTtlMs is part of the public surface; the
  // dialog could render a "expires in Nh" line in the future.
  void tokenTtlMs

  // Copy feedback: idle → copied|copyFailed for a short window, then back.
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  useEffect(() => {
    if (copyState === 'idle') return
    const timer = setTimeout(() => { setCopyState('idle') }, 1500)
    return () => { clearTimeout(timer) }
  }, [copyState])

  const onCopy = (): void => {
    const url = payload !== '' ? payload : composeQrUrl(token)
    void copyTextToClipboard(url).then((ok) => { setCopyState(ok ? 'copied' : 'failed') })
  }

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

  // Render nothing until the portal target resolves; this also keeps SSR
  // safe if anyone ever turns the host half SSR.
  if (portalTarget === null) return null

  return createPortal(
    createElement('div', {
      className: styles.backdrop,
      role: 'presentation',
      onClick: onBackdropClick,
    },
      createElement('div', {
        className: styles.dialog,
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'dsh-qr-share-title',
      },
        createElement('h2', { id: 'dsh-qr-share-title', className: styles.title },
          t('dialog.title')),
        error !== null
          ? createElement('p', { className: styles.err }, `${t('dialog.error')}: ${error}`)
          : createElement('canvas', {
              ref: canvasRef,
              className: styles.canvas,
              width: 256,
              height: 256,
            }),
        createElement('div', { className: styles.urlBlock },
          createElement('span', { className: styles.urlLabel }, t('dialog.urlLabel')),
          createElement('code', { className: styles.url }, payload),
        ),
        createElement('p', { className: styles.hint }, t('dialog.hint')),
        createElement('div', { className: styles.actions },
          createElement('button', {
            type: 'button',
            className: styles.action,
            onClick: onCopy,
          }, copyState === 'copied'
            ? t('dialog.copied')
            : copyState === 'failed'
              ? t('dialog.copyFailed')
              : t('dialog.copy')),
          createElement('button', {
            type: 'button',
            className: styles.action,
            onClick: onClose,
          }, t('dialog.close')),
        ),
      ),
    ),
    portalTarget,
  )
}

void LOCALE_NS
