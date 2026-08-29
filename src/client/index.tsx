/**
 * dsh-qr-share client half.
 *
 * Registers a single `sidebar.footer.action` slot occupant that renders
 * the QR-code button. The button stays mounted but hidden until the host
 * half's `/_qr/share` returns `ready: true` — that happens exactly when
 *   (a) the request passed `connection.requestRejection` (Host/Origin
 *       trusted AND browser cookie valid), AND
 *   (b) a non-empty launch token was minted.
 * Both conditions jointly mean "the desktop has already completed the
 * token-exchange redirect and now lives on /, not on /?token=…".
 */
import { Fragment, createElement, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { QrButton } from './QrButton.tsx'
import { fetchShareInfo, type ShareInfo } from './api.ts'
import { LOCALE_NS, zh, en } from './locales.ts'

// Ambient module augmentations — the host runtime supplies the real
// service shapes via type-only declarations in its `@deepseek-ai/*`
// packages. We declare just enough for our apply() to type-check.
declare module '@deepseek-ai/cordis' {
  interface Context {
    locale: {
      register(ns: string, dict: { zh: unknown; en: unknown }): () => void
      bind(ns: string): (k: string) => string
    }
    slots: {
      inject(slot: string, factory: () => unknown): void
      register(opts: {
        name: string
        id: string
        order: number
        locale: string
      }, component: (owner: SidebarFooterActionOwnerPropsLike) => ReactNode): () => void
    }
    /** Empty marker: this entry only needs slots + locale. */
  }
}

interface SidebarFooterActionOwnerPropsLike {
  wide: boolean
}

/** Services required before this entry activates. */
export const inject = ['slots', 'locale', 'connection'] as const

/**
 * The footer-action component. Mounted by the slot registry; receives the
 * sidebar's wide/rail state via the slot owner props.
 * @param owner - slot owner props from the sidebar shell.
 * @param t - locale reader bound by the apply function below.
 */
function FooterAction(
  owner: SidebarFooterActionOwnerPropsLike,
  t: (k: keyof typeof zh) => string,
): ReactNode {
  const [info, setInfo] = useState<ShareInfo | null>(null)

  useEffect(() => {
    // Probe on mount; refresh on window focus (a fresh login in another
    // tab + focus-back should immediately enable the button).
    let cancelled = false
    const refresh = (): void => {
      void fetchShareInfo().then((next) => {
        if (!cancelled) setInfo(next)
      })
    }
    refresh()
    window.addEventListener('focus', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('focus', refresh)
    }
  }, [])

  // Two-stage gate: null = still probing (no flicker); !ready = server
  // says "no" (button hidden); ready = render.
  if (info === null) return null
  if (!info.ready) return null

  return createElement(QrButton, { info, wide: owner.wide, t })
}

/**
 * Register dictionaries and the slot occupant.
 * @param ctx - client root context (slots + locale + connection injected).
 */
export function apply(ctx: import('@deepseek-ai/cordis').Context): void {
  // Locale registration is a side-effect on the locale service; the slot
  // rendering reads through the bound `t` thunk the apply captures here.
  ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), 'qr-share: dictionaries')
  const t = ctx.locale.bind(LOCALE_NS) as (k: keyof typeof zh) => string

  ctx.slots.inject('sidebar.footer.action', () =>
    ctx.slots.register({
      name: 'sidebar.footer.action',
      id: 'qr-share',
      order: 100, // after the Settings icon (which is order 0/10)
      locale: LOCALE_NS,
    }, (owner: SidebarFooterActionOwnerPropsLike) => FooterAction(owner, t)),
  )
}

// Suppress unused warning for Fragment; we keep the import so future
// expansions (toast messages, multi-button groups) don't churn imports.
void Fragment
