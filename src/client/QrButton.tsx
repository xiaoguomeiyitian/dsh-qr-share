/**
 * Sidebar footer action: a QR-code icon button. Clicking opens the
 * `QrDialog`. The button renders only when the server reports `ready`
 * (i.e. the browser is past the launch-token exchange AND a token is
 * available); otherwise it stays mounted-but-empty so the slot ledger
 * remains stable across the login → main transition.
 */
import { Fragment, createElement, useState } from 'react'
import type { ReactNode } from 'react'
import { HiOutlineQrCode } from 'react-icons/hi2'
import { QrDialog } from './QrDialog.tsx'
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

export function QrButton({ info, wide, t }: QrButtonProps): ReactNode {
  const [open, setOpen] = useState(false)
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
          token: info.token,
          tokenTtlMs: info.tokenTtlMs,
          t,
          onClose: () => { setOpen(false) },
        })
      : null,
  )
}

void LOCALE_NS
