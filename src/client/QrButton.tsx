/**
 * Sidebar footer action: a QR-code icon button. Clicking opens the
 * `QrDialog`. The button renders only when the server reports `ready`
 * (i.e. the browser is past the launch-token exchange AND a token is
 * available); otherwise it stays mounted-but-empty so the slot ledger
 * remains stable across the login → main transition.
 */
import { Fragment, createElement, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { HiOutlineQrCode } from 'react-icons/hi2'
import { QrDialog } from './QrDialog.tsx'
import { fetchShareInfo, type ShareInfo } from './api.ts'
import { LOCALE_NS } from './locales.ts'
import styles from './styles.module.css'

export interface QrButtonProps {
  /** Authoritative payload from the host half. */
  info: { token: string; tokenTtlMs: number }
  /** Sidebar column state: true = wide (icon + label), false = rail (icon only). */
  wide: boolean
  /** Locale reader from ctx.locale.bind(LOCALE_NS). */
  t: (key: keyof typeof import('./locales.ts').zh) => string
}

/**
 * Re-fetch cadence while the dialog stays open. The launch token is minted
 * per Host activation, so a dialog left open across a `dsh web` restart
 * would otherwise keep encoding the dead token until it is reopened.
 */
const REFRESH_INTERVAL_MS = 15_000

export function QrButton({ info, wide, t }: QrButtonProps): ReactNode {
  const [open, setOpen] = useState(false)
  // Fresh payload fetched while the dialog is open; `null` until the first
  // in-dialog fetch succeeds. Falls back to the probed `info` so the dialog
  // still renders when the re-fetch has not landed (or failed).
  const [fresh, setFresh] = useState<ShareInfo | null>(null)

  useEffect(() => {
    if (!open) {
      setFresh(null)
      return
    }
    let cancelled = false
    const refresh = (): void => {
      void fetchShareInfo().then((next) => {
        if (!cancelled) setFresh(next)
      })
    }
    // Re-fetch on every open: the token belongs to the *current* Host
    // activation, so a copy cached before a restart must not be reused.
    refresh()
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [open])

  const current = fresh?.ready === true && fresh.token !== '' ? fresh : info

  return createElement(Fragment, null,
    createElement('button', {
      type: 'button',
      className: styles.button,
      'aria-label': t('button.label'),
      title: t('button.tooltip'),
      onClick: () => { setOpen(true) },
    },
      createElement(HiOutlineQrCode, { size: wide ? 18 : 20 }),
      wide
        ? createElement('span', { className: styles.buttonLabel }, t('button.label'))
        : null,
    ),
    open
      ? createElement(QrDialog, {
          token: current.token,
          tokenTtlMs: current.tokenTtlMs,
          t,
          onClose: () => { setOpen(false) },
        })
      : null,
  )
}

void LOCALE_NS
