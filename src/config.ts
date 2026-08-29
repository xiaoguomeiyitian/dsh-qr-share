/**
 * dsh-qr-share Config schema. The host half is mounted as a cordis
 * `insert` row; the `config` field in the patch is fed here. Defaults
 * match a "just works" deployment with no patch config.
 *
 * Note: we DO NOT read DSH_PUBLIC_HOST here — the QR URL is composed
 * by the browser from `window.location.origin`, so no configuration is
 * required for the QR to point at the right host. The web-app
 * trustedHosts patch (set elsewhere) still gates the /_qr/share route
 * via the same trust fence that gates /api.
 *
 * We intentionally avoid @deepseek-ai/schemastery / zod — the patch
 * overlay can only feed plain JS values, so a hand-rolled validator
 * keeps the host bundle dependency-free.
 */

/** Wire shape (defaults applied). */
export interface ResolvedConfig {
  /** Master switch: false short-circuits the route to 404. */
  enabled: boolean
}

const DEFAULTS: ResolvedConfig = { enabled: true }

/**
 * Apply defaults + permissive coercion. Patch-time `config:` maps are
 * untyped JS objects; anything truthy that isn't explicitly `false`
 * counts as enabled.
 * @param raw - patch-time config object (or undefined).
 * @returns resolved config.
 */
export function resolveConfig(raw: unknown): ResolvedConfig {
  if (raw === null || typeof raw !== 'object') return DEFAULTS
  const value = (raw as { enabled?: unknown }).enabled
  if (value === false) return { enabled: false }
  return DEFAULTS
}
