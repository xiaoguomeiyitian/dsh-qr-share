/**
 * dsh-qr-share invariant — fails fast when the host half is loaded without
 * the services it declares in `inject`. Mirrors the official DSH plugin
 * invariant pattern (used by every bundle in the monorepo) so a misconfigured
 * mount surfaces a precise error rather than a runtime undefined access.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/** Throws when the import-time guard fails; never returns. */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`dsh-qr-share: ${message}`)
  }
}

/**
 * Guard `require` to the official Node context — the host half MUST NOT
 * be loaded through the browser module table. The bundler's purity gate
 * already blocks Node-builtin imports in the client bundles; this is the
 * defense-in-depth runtime check.
 */
export function assertNodeContext(): void {
  // Trigger a Node-only import to fail-fast in any non-Node runtime.
  require('node:fs')
}
