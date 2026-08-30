/**
 * Tests for `resolveConfig` — the host-half patch-time config validator.
 *
 * These cases are deliberately exhaustive over the JS truthiness table
 * because patch overlays feed `config:` as plain untyped objects, so the
 * validator is the only gate against malformed input.
 */
import { describe, expect, it } from 'vitest'
import { resolveConfig, type ResolvedConfig } from './config.ts'

describe('resolveConfig', () => {
  it('returns defaults when raw is undefined', () => {
    expect(resolveConfig(undefined)).toEqual({ enabled: true })
  })

  it('returns defaults when raw is null', () => {
    expect(resolveConfig(null)).toEqual({ enabled: true })
  })

  it('returns defaults when raw is a non-object primitive', () => {
    expect(resolveConfig(42)).toEqual({ enabled: true })
    expect(resolveConfig('on')).toEqual({ enabled: true })
    expect(resolveConfig(true)).toEqual({ enabled: true })
  })

  it('returns defaults when raw.enabled is omitted', () => {
    const raw = { /* no enabled key */ } as unknown
    expect(resolveConfig(raw)).toEqual({ enabled: true })
  })

  it('returns enabled=false when raw.enabled is the literal false', () => {
    expect(resolveConfig({ enabled: false })).toEqual({ enabled: false })
  })

  it('treats any non-`false` value of raw.enabled as enabled (true)', () => {
    // Patch overlays may carry truthy-but-not-boolean flags (e.g. "yes",
    // 1, "true"). The contract is "only the literal false disables".
    const truthyValues: unknown[] = [true, 1, 'yes', 'true', {}, []]
    for (const value of truthyValues) {
      const got: ResolvedConfig = resolveConfig({ enabled: value })
      expect(got).toEqual({ enabled: true })
    }
  })

  it('returns the same defaults object for the no-input case (by design)', () => {
    // resolveConfig(undefined) === resolveConfig(undefined) — they both
    // point at the module-scoped DEFAULTS. Document the current behavior
    // so a future "deep-clone DEFAULTS" change is a conscious decision
    // rather than an accidental surprise.
    const first = resolveConfig(undefined)
    const second = resolveConfig(undefined)
    expect(first).toBe(second)
    expect(first).toEqual(second)
  })

  it('returns distinct objects when raw differs from undefined (e.g. explicit false)', () => {
    // The `enabled: false` branch returns a *new* object so callers
    // who mutate it cannot leak into the DEFAULTS constant.
    const a = resolveConfig({ enabled: false })
    const b = resolveConfig({ enabled: false })
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })

  it('ignores unrelated keys in the raw object', () => {
    // Future config fields (ttlSeconds, maxScansPerSession) might be
    // present; the validator must not crash, only consult `enabled`.
    expect(resolveConfig({ enabled: true, foo: 'bar' })).toEqual({ enabled: true })
    expect(resolveConfig({ enabled: false, foo: 'bar' })).toEqual({ enabled: false })
  })
})