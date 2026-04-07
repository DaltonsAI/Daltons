import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getEnabledAuthProviders } from '@/lib/auth/providers'

describe('getEnabledAuthProviders (lib/auth/providers)', () => {
  const original = process.env.NEXT_PUBLIC_AUTH_PROVIDERS

  afterEach(() => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDERS = original
  })

  it('defaults to github when env var is not set', () => {
    delete process.env.NEXT_PUBLIC_AUTH_PROVIDERS
    const providers = getEnabledAuthProviders()
    expect(providers.github).toBe(true)
    expect(providers.vercel).toBe(false)
  })

  it('enables vercel when specified', () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDERS = 'github,vercel'
    const providers = getEnabledAuthProviders()
    expect(providers.github).toBe(true)
    expect(providers.vercel).toBe(true)
  })

  it('supports vercel-only config', () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDERS = 'vercel'
    const providers = getEnabledAuthProviders()
    expect(providers.github).toBe(false)
    expect(providers.vercel).toBe(true)
  })
})
